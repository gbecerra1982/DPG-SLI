# 📸 SISTEMA DE VALIDACIÓN DE CALIDAD DE FOTO EN TIEMPO REAL

## 🎯 Objetivo

Prevenir que repartidores capturen fotos de baja calidad (oscuras, borrosas, movidas, sin texto legible) que sean imposibles de verificar posteriormente. El sistema debe rechazar automáticamente fotos que no cumplan con estándares mínimos de calidad y proporcionar feedback inmediato al usuario para recaptura.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    APP ANDROID - REPARTIDOR                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. CameraX Capture                                       │   │
│  │    - Captura foto con CameraX                            │   │
│  │    - Obtiene URI temporal de imagen                      │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2. PhotoQualityValidator (VALIDACIÓN EN TIEMPO REAL)    │   │
│  │    ┌─────────────────────────────────────────────┐      │   │
│  │    │ a) BrightnessChecker                        │      │   │
│  │    │    - Analiza histograma de luminosidad      │      │   │
│  │    │    - Rechaza fotos muy oscuras/claras       │      │   │
│  │    └─────────────────────────────────────────────┘      │   │
│  │    ┌─────────────────────────────────────────────┐      │   │
│  │    │ b) BlurDetector (Laplacian Variance)        │      │   │
│  │    │    - Calcula varianza de gradientes         │      │   │
│  │    │    - Detecta desenfoque/movimiento          │      │   │
│  │    └─────────────────────────────────────────────┘      │   │
│  │    ┌─────────────────────────────────────────────┐      │   │
│  │    │ c) ResolutionChecker                        │      │   │
│  │    │    - Verifica dimensiones mínimas           │      │   │
│  │    │    - Valida aspect ratio                    │      │   │
│  │    └─────────────────────────────────────────────┘      │   │
│  │    ┌─────────────────────────────────────────────┐      │   │
│  │    │ d) TextDetector (ML Kit)                    │      │   │
│  │    │    - Detecta presencia de texto legible     │      │   │
│  │    │    - Valida que código/tracking sea visible │      │   │
│  │    └─────────────────────────────────────────────┘      │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│            ┌──────────────────────┐                             │
│            │ ¿Foto válida?        │                             │
│            └──────────┬───────────┘                             │
│                       │                                          │
│         ┌─────────────┴─────────────┐                           │
│         │ NO                        │ SÍ                        │
│         ▼                           ▼                           │
│  ┌──────────────┐          ┌──────────────────┐                │
│  │ 3. Rechazar  │          │ 4. Aceptar       │                │
│  │ - Mostrar    │          │ - Guardar imagen │                │
│  │   feedback   │          │ - Continuar con  │                │
│  │ - Permitir   │          │   anti-fraude    │                │
│  │   recaptura  │          │ - Crear scan     │                │
│  └──────────────┘          └──────────────────┘                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Base de Datos

### SQLite (Android Local)

#### Tabla: `photo_quality_validations`

```sql
CREATE TABLE photo_quality_validations (
    validation_id TEXT PRIMARY KEY,
    scan_id TEXT,
    image_path TEXT NOT NULL,
    validation_timestamp TEXT NOT NULL,

    -- Resultados de validación
    is_valid INTEGER NOT NULL DEFAULT 0, -- 0 = rejected, 1 = accepted

    -- Métricas de calidad
    brightness_score REAL,          -- 0.0 - 1.0 (óptimo: 0.3 - 0.7)
    brightness_passed INTEGER,      -- 0 = failed, 1 = passed

    blur_score REAL,                -- Laplacian variance (>100 = sharp, <100 = blurry)
    blur_passed INTEGER,

    resolution_width INTEGER,
    resolution_height INTEGER,
    resolution_passed INTEGER,

    text_detected INTEGER,          -- 0 = no text, 1 = text found
    text_confidence REAL,           -- 0.0 - 1.0
    text_passed INTEGER,

    -- Razón de rechazo
    rejection_reason TEXT,          -- "TOO_DARK", "BLURRY", "NO_TEXT", "LOW_RESOLUTION"
    rejection_details TEXT,         -- JSON con detalles adicionales

    -- Metadatos
    retry_count INTEGER DEFAULT 0, -- Número de intentos del usuario
    final_accepted INTEGER DEFAULT 0, -- 1 si eventualmente se aceptó

    FOREIGN KEY (scan_id) REFERENCES scans(scan_id)
);

CREATE INDEX idx_quality_timestamp ON photo_quality_validations(validation_timestamp);
CREATE INDEX idx_quality_scan ON photo_quality_validations(scan_id);
CREATE INDEX idx_quality_valid ON photo_quality_validations(is_valid);
```

### Cosmos DB - SCANS Container (Añadir campo)

```json
{
  "scanId": "scn_20251027_123",
  "packageId": "pkg_20251027_001",
  "scanTimestamp": "2025-10-27T14:30:00Z",

  // NUEVO: Campo de calidad de foto
  "photoQuality": {
    "validationId": "qual_20251027_456",
    "validationTimestamp": "2025-10-27T14:30:01Z",
    "isValid": true,
    "metrics": {
      "brightness": {
        "score": 0.52,
        "passed": true,
        "threshold": { "min": 0.3, "max": 0.7 }
      },
      "blur": {
        "score": 145.8,
        "passed": true,
        "threshold": { "min": 100 }
      },
      "resolution": {
        "width": 1920,
        "height": 1080,
        "passed": true,
        "threshold": { "minWidth": 1280, "minHeight": 720 }
      },
      "text": {
        "detected": true,
        "confidence": 0.89,
        "passed": true,
        "threshold": { "minConfidence": 0.7 }
      }
    },
    "retryCount": 0,
    "processingTimeMs": 1250
  },

  "antiFraud": { ... },
  "images": { ... }
}
```

### Cosmos DB - Nuevo Container: QUALITY_ANALYTICS

```json
{
  "id": "qa_20251027_daily",
  "analyticsId": "qa_20251027_daily",
  "type": "quality_analytics",
  "partitionKey": "2025-10-27", // Fecha (YYYY-MM-DD)

  "date": "2025-10-27",
  "organizationId": "org_jj",

  // Estadísticas del día
  "totalValidations": 1250,
  "totalAccepted": 1050,
  "totalRejected": 200,
  "acceptanceRate": 0.84, // 84%

  // Razones de rechazo
  "rejectionReasons": {
    "TOO_DARK": 85,
    "TOO_BRIGHT": 12,
    "BLURRY": 68,
    "NO_TEXT": 25,
    "LOW_RESOLUTION": 10
  },

  // Métricas promedio
  "averageMetrics": {
    "brightness": 0.51,
    "blurScore": 132.5,
    "textConfidence": 0.87,
    "retryCount": 1.6, // Promedio de intentos por foto aceptada
    "processingTimeMs": 1180
  },

  // Top repartidores con más rechazos
  "topRejectingDrivers": [
    {
      "driverId": "drv_001",
      "driverName": "Juan Pérez",
      "totalValidations": 50,
      "rejected": 18,
      "rejectionRate": 0.36
    }
  ],

  "createdAt": "2025-10-27T23:59:59Z",
  "updatedAt": "2025-10-27T23:59:59Z"
}
```

---

## 💻 Implementación Android

### 1. Dependencias (build.gradle.kts)

```kotlin
dependencies {
    // ML Kit para detección de texto
    implementation("com.google.mlkit:text-recognition:16.0.1")

    // OpenCV para análisis de imagen (opcional, para blur detection)
    implementation("org.opencv:opencv:4.9.0")

    // Existentes
    implementation("androidx.camera:camera-camera2:1.4.1")
    implementation("androidx.camera:camera-lifecycle:1.4.1")
    implementation("androidx.camera:camera-view:1.4.1")
}
```

### 2. Data Classes

```kotlin
// PhotoQualityModels.kt

data class PhotoQualityResult(
    val isValid: Boolean,
    val validationId: String,
    val metrics: QualityMetrics,
    val rejectionReason: RejectionReason? = null,
    val rejectionDetails: String? = null,
    val processingTimeMs: Long
)

data class QualityMetrics(
    val brightness: BrightnessMetric,
    val blur: BlurMetric,
    val resolution: ResolutionMetric,
    val text: TextMetric
)

data class BrightnessMetric(
    val score: Float,        // 0.0 - 1.0
    val passed: Boolean,
    val threshold: Pair<Float, Float> = Pair(0.3f, 0.7f)
)

data class BlurMetric(
    val score: Float,        // Laplacian variance
    val passed: Boolean,
    val threshold: Float = 100f
)

data class ResolutionMetric(
    val width: Int,
    val height: Int,
    val passed: Boolean,
    val thresholdWidth: Int = 1280,
    val thresholdHeight: Int = 720
)

data class TextMetric(
    val detected: Boolean,
    val confidence: Float,   // 0.0 - 1.0
    val passed: Boolean,
    val threshold: Float = 0.7f
)

enum class RejectionReason(val message: String) {
    TOO_DARK("La foto está muy oscura. Busca mejor iluminación."),
    TOO_BRIGHT("La foto está sobreexpuesta. Reduce la luz directa."),
    BLURRY("La foto está borrosa o movida. Mantén el celular firme."),
    NO_TEXT("No se detectó texto en la foto. Asegúrate de capturar el código de paquete."),
    LOW_RESOLUTION("La resolución de la foto es muy baja. Verifica la configuración de la cámara.")
}
```

### 3. PhotoQualityValidator.kt

```kotlin
package com.logistics.android.services

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import org.opencv.android.Utils
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import java.util.UUID
import kotlin.math.pow
import kotlin.math.sqrt
import kotlin.system.measureTimeMillis

class PhotoQualityValidator(private val context: Context) {

    companion object {
        // Umbrales configurables
        const val MIN_BRIGHTNESS = 0.3f
        const val MAX_BRIGHTNESS = 0.7f
        const val MIN_BLUR_SCORE = 100f
        const val MIN_WIDTH = 1280
        const val MIN_HEIGHT = 720
        const val MIN_TEXT_CONFIDENCE = 0.7f
    }

    private val textRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    suspend fun validatePhoto(imageUri: Uri): PhotoQualityResult = withContext(Dispatchers.IO) {
        val validationId = "qual_${System.currentTimeMillis()}_${UUID.randomUUID().toString().substring(0, 8)}"

        val elapsedTime = measureTimeMillis {
            // Cargar bitmap
            val bitmap = loadBitmap(imageUri)

            // 1. Validar resolución
            val resolutionMetric = checkResolution(bitmap)
            if (!resolutionMetric.passed) {
                return@withContext PhotoQualityResult(
                    isValid = false,
                    validationId = validationId,
                    metrics = QualityMetrics(
                        brightness = BrightnessMetric(0f, false),
                        blur = BlurMetric(0f, false),
                        resolution = resolutionMetric,
                        text = TextMetric(false, 0f, false)
                    ),
                    rejectionReason = RejectionReason.LOW_RESOLUTION,
                    rejectionDetails = "Resolución: ${resolutionMetric.width}x${resolutionMetric.height} (mínimo: ${MIN_WIDTH}x${MIN_HEIGHT})",
                    processingTimeMs = 0
                )
            }

            // 2. Validar brillo
            val brightnessMetric = checkBrightness(bitmap)
            if (!brightnessMetric.passed) {
                val reason = if (brightnessMetric.score < MIN_BRIGHTNESS) {
                    RejectionReason.TOO_DARK
                } else {
                    RejectionReason.TOO_BRIGHT
                }
                return@withContext PhotoQualityResult(
                    isValid = false,
                    validationId = validationId,
                    metrics = QualityMetrics(
                        brightness = brightnessMetric,
                        blur = BlurMetric(0f, false),
                        resolution = resolutionMetric,
                        text = TextMetric(false, 0f, false)
                    ),
                    rejectionReason = reason,
                    rejectionDetails = "Brillo: ${brightnessMetric.score} (rango óptimo: $MIN_BRIGHTNESS - $MAX_BRIGHTNESS)",
                    processingTimeMs = 0
                )
            }

            // 3. Validar nitidez (blur)
            val blurMetric = checkBlur(bitmap)
            if (!blurMetric.passed) {
                return@withContext PhotoQualityResult(
                    isValid = false,
                    validationId = validationId,
                    metrics = QualityMetrics(
                        brightness = brightnessMetric,
                        blur = blurMetric,
                        resolution = resolutionMetric,
                        text = TextMetric(false, 0f, false)
                    ),
                    rejectionReason = RejectionReason.BLURRY,
                    rejectionDetails = "Puntuación de nitidez: ${blurMetric.score} (mínimo: $MIN_BLUR_SCORE)",
                    processingTimeMs = 0
                )
            }

            // 4. Validar texto (ML Kit)
            val textMetric = checkText(imageUri)
            if (!textMetric.passed) {
                return@withContext PhotoQualityResult(
                    isValid = false,
                    validationId = validationId,
                    metrics = QualityMetrics(
                        brightness = brightnessMetric,
                        blur = blurMetric,
                        resolution = resolutionMetric,
                        text = textMetric
                    ),
                    rejectionReason = RejectionReason.NO_TEXT,
                    rejectionDetails = if (textMetric.detected) {
                        "Texto detectado con baja confianza: ${textMetric.confidence}"
                    } else {
                        "No se detectó texto en la imagen"
                    },
                    processingTimeMs = 0
                )
            }

            // ✅ Todas las validaciones pasaron
            return@withContext PhotoQualityResult(
                isValid = true,
                validationId = validationId,
                metrics = QualityMetrics(
                    brightness = brightnessMetric,
                    blur = blurMetric,
                    resolution = resolutionMetric,
                    text = textMetric
                ),
                processingTimeMs = 0
            )
        }

        // Actualizar tiempo de procesamiento
        return@withContext PhotoQualityResult(
            isValid = true,
            validationId = validationId,
            metrics = QualityMetrics(
                brightness = checkBrightness(loadBitmap(imageUri)),
                blur = checkBlur(loadBitmap(imageUri)),
                resolution = checkResolution(loadBitmap(imageUri)),
                text = checkText(imageUri)
            ),
            processingTimeMs = elapsedTime
        )
    }

    private fun loadBitmap(uri: Uri): Bitmap {
        val inputStream = context.contentResolver.openInputStream(uri)
        return BitmapFactory.decodeStream(inputStream)
    }

    private fun checkResolution(bitmap: Bitmap): ResolutionMetric {
        val width = bitmap.width
        val height = bitmap.height
        val passed = width >= MIN_WIDTH && height >= MIN_HEIGHT

        return ResolutionMetric(
            width = width,
            height = height,
            passed = passed,
            thresholdWidth = MIN_WIDTH,
            thresholdHeight = MIN_HEIGHT
        )
    }

    private fun checkBrightness(bitmap: Bitmap): BrightnessMetric {
        val pixels = IntArray(bitmap.width * bitmap.height)
        bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)

        var totalBrightness = 0f
        for (pixel in pixels) {
            val r = (pixel shr 16 and 0xFF) / 255f
            val g = (pixel shr 8 and 0xFF) / 255f
            val b = (pixel and 0xFF) / 255f

            // Calcular luminosidad (fórmula estándar)
            val brightness = 0.299f * r + 0.587f * g + 0.114f * b
            totalBrightness += brightness
        }

        val avgBrightness = totalBrightness / pixels.size
        val passed = avgBrightness in MIN_BRIGHTNESS..MAX_BRIGHTNESS

        return BrightnessMetric(
            score = avgBrightness,
            passed = passed,
            threshold = Pair(MIN_BRIGHTNESS, MAX_BRIGHTNESS)
        )
    }

    private fun checkBlur(bitmap: Bitmap): BlurMetric {
        // Convertir Bitmap a OpenCV Mat
        val mat = Mat()
        val bmp32 = bitmap.copy(Bitmap.Config.ARGB_8888, true)
        Utils.bitmapToMat(bmp32, mat)

        // Convertir a escala de grises
        val grayMat = Mat()
        Imgproc.cvtColor(mat, grayMat, Imgproc.COLOR_RGB2GRAY)

        // Aplicar operador Laplaciano
        val laplacian = Mat()
        Imgproc.Laplacian(grayMat, laplacian, CvType.CV_64F)

        // Calcular varianza (medida de nitidez)
        val mean = org.opencv.core.Core.mean(laplacian)
        val stdDev = org.opencv.core.MatOfDouble()
        org.opencv.core.Core.meanStdDev(laplacian, org.opencv.core.MatOfDouble(), stdDev)

        val variance = stdDev.get(0, 0)[0].pow(2)
        val blurScore = variance.toFloat()
        val passed = blurScore >= MIN_BLUR_SCORE

        // Liberar recursos
        mat.release()
        grayMat.release()
        laplacian.release()

        return BlurMetric(
            score = blurScore,
            passed = passed,
            threshold = MIN_BLUR_SCORE
        )
    }

    private suspend fun checkText(imageUri: Uri): TextMetric = withContext(Dispatchers.IO) {
        try {
            val inputImage = InputImage.fromFilePath(context, imageUri)
            val result = textRecognizer.process(inputImage).await()

            val detected = result.textBlocks.isNotEmpty()

            // Calcular confianza promedio de todos los bloques de texto
            val avgConfidence = if (detected) {
                result.textBlocks.map { it.confidence ?: 0f }.average().toFloat()
            } else {
                0f
            }

            val passed = detected && avgConfidence >= MIN_TEXT_CONFIDENCE

            TextMetric(
                detected = detected,
                confidence = avgConfidence,
                passed = passed,
                threshold = MIN_TEXT_CONFIDENCE
            )
        } catch (e: Exception) {
            // En caso de error, marcar como no detectado
            TextMetric(
                detected = false,
                confidence = 0f,
                passed = false,
                threshold = MIN_TEXT_CONFIDENCE
            )
        }
    }

    fun cleanup() {
        textRecognizer.close()
    }
}
```

### 4. PhotoQualityDao.kt

```kotlin
package com.logistics.android.data.dao

import androidx.room.*
import com.logistics.android.data.entities.PhotoQualityValidation

@Dao
interface PhotoQualityDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(validation: PhotoQualityValidation): Long

    @Query("""
        SELECT * FROM photo_quality_validations
        WHERE scan_id = :scanId
        ORDER BY validation_timestamp DESC
        LIMIT 1
    """)
    suspend fun getValidationForScan(scanId: String): PhotoQualityValidation?

    @Query("""
        SELECT * FROM photo_quality_validations
        WHERE is_valid = 0
        ORDER BY validation_timestamp DESC
        LIMIT 50
    """)
    suspend fun getRecentRejections(): List<PhotoQualityValidation>

    @Query("""
        SELECT AVG(retry_count) as avg_retries
        FROM photo_quality_validations
        WHERE is_valid = 1
    """)
    suspend fun getAverageRetryCount(): Float?

    @Query("""
        SELECT rejection_reason, COUNT(*) as count
        FROM photo_quality_validations
        WHERE is_valid = 0
        GROUP BY rejection_reason
        ORDER BY count DESC
    """)
    suspend fun getRejectionStatistics(): Map<String, Int>
}
```

### 5. PhotoQualityValidation.kt (Entity)

```kotlin
package com.logistics.android.data.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "photo_quality_validations")
data class PhotoQualityValidation(
    @PrimaryKey
    @ColumnInfo(name = "validation_id")
    val validationId: String,

    @ColumnInfo(name = "scan_id")
    val scanId: String? = null,

    @ColumnInfo(name = "image_path")
    val imagePath: String,

    @ColumnInfo(name = "validation_timestamp")
    val validationTimestamp: String,

    @ColumnInfo(name = "is_valid")
    val isValid: Boolean,

    // Brightness
    @ColumnInfo(name = "brightness_score")
    val brightnessScore: Float,
    @ColumnInfo(name = "brightness_passed")
    val brightnessPassed: Boolean,

    // Blur
    @ColumnInfo(name = "blur_score")
    val blurScore: Float,
    @ColumnInfo(name = "blur_passed")
    val blurPassed: Boolean,

    // Resolution
    @ColumnInfo(name = "resolution_width")
    val resolutionWidth: Int,
    @ColumnInfo(name = "resolution_height")
    val resolutionHeight: Int,
    @ColumnInfo(name = "resolution_passed")
    val resolutionPassed: Boolean,

    // Text
    @ColumnInfo(name = "text_detected")
    val textDetected: Boolean,
    @ColumnInfo(name = "text_confidence")
    val textConfidence: Float,
    @ColumnInfo(name = "text_passed")
    val textPassed: Boolean,

    // Rejection
    @ColumnInfo(name = "rejection_reason")
    val rejectionReason: String? = null,
    @ColumnInfo(name = "rejection_details")
    val rejectionDetails: String? = null,

    // Metadata
    @ColumnInfo(name = "retry_count")
    val retryCount: Int = 0,
    @ColumnInfo(name = "final_accepted")
    val finalAccepted: Boolean = false
)
```

### 6. Integración en ScanViewModel.kt

```kotlin
package com.logistics.android.ui.scan

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.logistics.android.services.PhotoQualityValidator
import com.logistics.android.services.AntiFraudService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.Instant

class ScanViewModel(
    private val photoQualityValidator: PhotoQualityValidator,
    private val antiFraudService: AntiFraudService,
    private val scanDao: ScanDao,
    private val qualityDao: PhotoQualityDao
) : ViewModel() {

    private val _scanState = MutableStateFlow<ScanState>(ScanState.Idle)
    val scanState: StateFlow<ScanState> = _scanState

    private var currentRetryCount = 0

    fun processPhoto(imageUri: Uri, packageId: String, driverId: String) {
        viewModelScope.launch {
            _scanState.value = ScanState.Validating

            try {
                // PASO 1: Validar calidad de foto
                val qualityResult = photoQualityValidator.validatePhoto(imageUri)

                // Guardar validación en BD local
                val validation = PhotoQualityValidation(
                    validationId = qualityResult.validationId,
                    scanId = null, // Todavía no hay scan
                    imagePath = imageUri.toString(),
                    validationTimestamp = Instant.now().toString(),
                    isValid = qualityResult.isValid,
                    brightnessScore = qualityResult.metrics.brightness.score,
                    brightnessPassed = qualityResult.metrics.brightness.passed,
                    blurScore = qualityResult.metrics.blur.score,
                    blurPassed = qualityResult.metrics.blur.passed,
                    resolutionWidth = qualityResult.metrics.resolution.width,
                    resolutionHeight = qualityResult.metrics.resolution.height,
                    resolutionPassed = qualityResult.metrics.resolution.passed,
                    textDetected = qualityResult.metrics.text.detected,
                    textConfidence = qualityResult.metrics.text.confidence,
                    textPassed = qualityResult.metrics.text.passed,
                    rejectionReason = qualityResult.rejectionReason?.name,
                    rejectionDetails = qualityResult.rejectionDetails,
                    retryCount = currentRetryCount
                )
                qualityDao.insert(validation)

                if (!qualityResult.isValid) {
                    currentRetryCount++
                    _scanState.value = ScanState.QualityRejected(
                        reason = qualityResult.rejectionReason!!,
                        details = qualityResult.rejectionDetails ?: "",
                        retryCount = currentRetryCount
                    )
                    return@launch
                }

                // PASO 2: Validar anti-fraude (solo si calidad OK)
                val fraudResult = antiFraudService.validateScanImage(
                    imagePath = imageUri.toString(),
                    driverId = driverId
                )

                when (fraudResult) {
                    is AntiFraudService.ValidationResult.Duplicate -> {
                        _scanState.value = ScanState.FraudDetected(fraudResult)
                        return@launch
                    }
                    is AntiFraudService.ValidationResult.Valid -> {
                        // PASO 3: Crear scan (solo si calidad + anti-fraude OK)
                        val scan = createScan(
                            packageId = packageId,
                            driverId = driverId,
                            imageUri = imageUri,
                            imageHash = fraudResult.imageHash,
                            qualityValidationId = qualityResult.validationId,
                            qualityMetrics = qualityResult.metrics
                        )

                        scanDao.insert(scan)

                        // Actualizar validación con scan_id
                        qualityDao.insert(validation.copy(
                            scanId = scan.scanId,
                            finalAccepted = true
                        ))

                        currentRetryCount = 0 // Reset counter
                        _scanState.value = ScanState.Success(scan)
                    }
                }

            } catch (e: Exception) {
                _scanState.value = ScanState.Error(e.message ?: "Error desconocido")
            }
        }
    }

    private fun createScan(...): Scan {
        // Implementación existente + añadir photoQuality al objeto
        // ...
    }
}

sealed class ScanState {
    object Idle : ScanState()
    object Validating : ScanState()
    data class QualityRejected(
        val reason: RejectionReason,
        val details: String,
        val retryCount: Int
    ) : ScanState()
    data class FraudDetected(val result: AntiFraudService.ValidationResult.Duplicate) : ScanState()
    data class Success(val scan: Scan) : ScanState()
    data class Error(val message: String) : ScanState()
}
```

### 7. PhotoQualityRejectionDialog.kt

```kotlin
package com.logistics.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.logistics.android.services.RejectionReason

@Composable
fun PhotoQualityRejectionDialog(
    reason: RejectionReason,
    details: String,
    retryCount: Int,
    onRetry: () -> Unit,
    onCancel: () -> Unit
) {
    Dialog(onDismissRequest = onCancel) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFFFFF3E0) // Naranja claro
            )
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Icono según tipo de error
                Icon(
                    imageVector = getIconForReason(reason),
                    contentDescription = null,
                    modifier = Modifier.size(64.dp),
                    tint = Color(0xFFFF6F00) // Naranja oscuro
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "⚠️ Foto Rechazada",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFBF360C)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = reason.message,
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center,
                    color = Color(0xFF5D4037)
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Consejos específicos
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFFFFE0B2)
                    )
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "💡 Consejos:",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = getTipsForReason(reason),
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF6D4C41)
                        )
                    }
                }

                if (retryCount > 0) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Intento #${retryCount + 1}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF757575)
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Botones
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onCancel,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancelar")
                    }
                    Button(
                        onClick = onRetry,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFFF6F00)
                        )
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Reintentar")
                    }
                }
            }
        }
    }
}

private fun getIconForReason(reason: RejectionReason): ImageVector {
    return when (reason) {
        RejectionReason.TOO_DARK -> Icons.Default.DarkMode
        RejectionReason.TOO_BRIGHT -> Icons.Default.LightMode
        RejectionReason.BLURRY -> Icons.Default.BlurOn
        RejectionReason.NO_TEXT -> Icons.Default.TextFields
        RejectionReason.LOW_RESOLUTION -> Icons.Default.HighQuality
    }
}

private fun getTipsForReason(reason: RejectionReason): String {
    return when (reason) {
        RejectionReason.TOO_DARK ->
            "• Activa el flash\n• Acércate a una ventana\n• Enciende luces adicionales"
        RejectionReason.TOO_BRIGHT ->
            "• Evita luz solar directa\n• Apaga el flash\n• Busca sombra parcial"
        RejectionReason.BLURRY ->
            "• Mantén el celular firme\n• Apóyate en una superficie\n• Espera 1 segundo antes de capturar"
        RejectionReason.NO_TEXT ->
            "• Enfoca el código de paquete\n• Acércate más\n• Limpia la etiqueta si está sucia"
        RejectionReason.LOW_RESOLUTION ->
            "• Verifica configuración de cámara\n• Limpia el lente\n• Reinicia la app si persiste"
    }
}
```

---

## 🌐 Backend API (Next.js)

### 1. POST /api/photo-quality/validate

```typescript
// src/app/api/photo-quality/validate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCosmosContainer } from '@/lib/cosmos';

export async function POST(request: NextRequest) {
  try {
    const { scanId, qualityMetrics } = await request.json();

    // Validar parámetros
    if (!scanId || !qualityMetrics) {
      return NextResponse.json(
        { error: 'Missing required fields: scanId, qualityMetrics' },
        { status: 400 }
      );
    }

    // Actualizar scan en Cosmos DB con métricas de calidad
    const scansContainer = await getCosmosContainer('SCANS');

    const { resource: scan } = await scansContainer.item(scanId, scanId).read();

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    // Actualizar con photoQuality
    const updatedScan = {
      ...scan,
      photoQuality: {
        validationId: qualityMetrics.validationId,
        validationTimestamp: new Date().toISOString(),
        isValid: qualityMetrics.isValid,
        metrics: qualityMetrics.metrics,
        retryCount: qualityMetrics.retryCount || 0,
        processingTimeMs: qualityMetrics.processingTimeMs
      },
      updatedAt: new Date().toISOString()
    };

    await scansContainer.item(scanId, scanId).replace(updatedScan);

    // Actualizar analytics diarias
    await updateQualityAnalytics(scan.organizationId, qualityMetrics);

    return NextResponse.json({
      success: true,
      scanId: scanId
    });

  } catch (error: any) {
    console.error('Error validating photo quality:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateQualityAnalytics(
  organizationId: string,
  qualityMetrics: any
) {
  const analyticsContainer = await getCosmosContainer('QUALITY_ANALYTICS');
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const analyticsId = `qa_${today}_${organizationId}`;

  try {
    const { resource: analytics } = await analyticsContainer
      .item(analyticsId, today)
      .read();

    if (analytics) {
      // Actualizar existente
      analytics.totalValidations++;

      if (qualityMetrics.isValid) {
        analytics.totalAccepted++;
      } else {
        analytics.totalRejected++;
        const reason = qualityMetrics.rejectionReason;
        analytics.rejectionReasons[reason] =
          (analytics.rejectionReasons[reason] || 0) + 1;
      }

      analytics.acceptanceRate =
        analytics.totalAccepted / analytics.totalValidations;

      await analyticsContainer.item(analyticsId, today).replace(analytics);
    } else {
      // Crear nuevo documento
      const newAnalytics = {
        id: analyticsId,
        analyticsId: analyticsId,
        type: 'quality_analytics',
        partitionKey: today,
        date: today,
        organizationId: organizationId,
        totalValidations: 1,
        totalAccepted: qualityMetrics.isValid ? 1 : 0,
        totalRejected: qualityMetrics.isValid ? 0 : 1,
        acceptanceRate: qualityMetrics.isValid ? 1.0 : 0.0,
        rejectionReasons: qualityMetrics.isValid ? {} : {
          [qualityMetrics.rejectionReason]: 1
        },
        averageMetrics: {
          brightness: qualityMetrics.metrics.brightness.score,
          blurScore: qualityMetrics.metrics.blur.score,
          textConfidence: qualityMetrics.metrics.text.confidence,
          retryCount: qualityMetrics.retryCount || 0,
          processingTimeMs: qualityMetrics.processingTimeMs
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await analyticsContainer.items.create(newAnalytics);
    }
  } catch (error) {
    console.error('Error updating quality analytics:', error);
  }
}
```

### 2. GET /api/photo-quality/analytics

```typescript
// src/app/api/photo-quality/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCosmosContainer } from '@/lib/cosmos';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId' },
        { status: 400 }
      );
    }

    const analyticsContainer = await getCosmosContainer('QUALITY_ANALYTICS');

    const querySpec = {
      query: `
        SELECT *
        FROM c
        WHERE c.organizationId = @organizationId
          AND c.date >= @startDate
          AND c.date <= @endDate
        ORDER BY c.date DESC
      `,
      parameters: [
        { name: '@organizationId', value: organizationId },
        { name: '@startDate', value: startDate || '2020-01-01' },
        { name: '@endDate', value: endDate || '2099-12-31' }
      ]
    };

    const { resources: analytics } = await analyticsContainer.items
      .query(querySpec)
      .fetchAll();

    // Calcular totales
    const totals = analytics.reduce((acc, day) => {
      acc.totalValidations += day.totalValidations;
      acc.totalAccepted += day.totalAccepted;
      acc.totalRejected += day.totalRejected;

      Object.entries(day.rejectionReasons || {}).forEach(([reason, count]) => {
        acc.rejectionReasons[reason] =
          (acc.rejectionReasons[reason] || 0) + (count as number);
      });

      return acc;
    }, {
      totalValidations: 0,
      totalAccepted: 0,
      totalRejected: 0,
      rejectionReasons: {} as Record<string, number>
    });

    totals.acceptanceRate = totals.totalValidations > 0
      ? totals.totalAccepted / totals.totalValidations
      : 0;

    return NextResponse.json({
      dailyAnalytics: analytics,
      totals: totals
    });

  } catch (error: any) {
    console.error('Error fetching quality analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Dashboard Web - Página de Calidad de Fotos

```typescript
// src/app/dashboard/calidad-fotos/page.tsx

'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CProgress
} from '@coreui/react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface QualityAnalytics {
  dailyAnalytics: DailyAnalytics[];
  totals: {
    totalValidations: number;
    totalAccepted: number;
    totalRejected: number;
    acceptanceRate: number;
    rejectionReasons: Record<string, number>;
  };
}

interface DailyAnalytics {
  date: string;
  totalValidations: number;
  totalAccepted: number;
  totalRejected: number;
  acceptanceRate: number;
  rejectionReasons: Record<string, number>;
}

export default function CalidadFotosPage() {
  const [analytics, setAnalytics] = useState<QualityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/photo-quality/analytics?organizationId=org_jj');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!analytics) return <div>No hay datos</div>;

  const rejectionReasonLabels: Record<string, string> = {
    'TOO_DARK': 'Muy Oscura',
    'TOO_BRIGHT': 'Muy Brillante',
    'BLURRY': 'Borrosa',
    'NO_TEXT': 'Sin Texto',
    'LOW_RESOLUTION': 'Baja Resolución'
  };

  // Gráfico de dona - Razones de rechazo
  const rejectionChartOptions = {
    labels: Object.keys(analytics.totals.rejectionReasons).map(
      key => rejectionReasonLabels[key] || key
    ),
    colors: ['#321fdb', '#3c4b64', '#e55353', '#f9b115', '#2eb85c'],
    legend: { position: 'bottom' as const }
  };

  const rejectionChartSeries = Object.values(analytics.totals.rejectionReasons);

  // Gráfico de línea - Tendencia diaria
  const trendChartOptions = {
    chart: { type: 'line' as const },
    xaxis: {
      categories: analytics.dailyAnalytics.map(d => d.date).reverse()
    },
    yaxis: {
      max: 100,
      labels: {
        formatter: (val: number) => `${val.toFixed(0)}%`
      }
    },
    stroke: { curve: 'smooth' as const },
    colors: ['#2eb85c']
  };

  const trendChartSeries = [{
    name: 'Tasa de Aceptación',
    data: analytics.dailyAnalytics.map(d => d.acceptanceRate * 100).reverse()
  }];

  return (
    <DashboardLayout>
      <h1 className="mb-4">📸 Calidad de Fotos</h1>

      {/* Tarjetas de resumen */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-primary">
            <CCardBody>
              <div className="fs-4 fw-semibold">
                {analytics.totals.totalValidations.toLocaleString()}
              </div>
              <div className="text-white-75">Total Validaciones</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-success">
            <CCardBody>
              <div className="fs-4 fw-semibold">
                {analytics.totals.totalAccepted.toLocaleString()}
              </div>
              <div className="text-white-75">Fotos Aceptadas</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-danger">
            <CCardBody>
              <div className="fs-4 fw-semibold">
                {analytics.totals.totalRejected.toLocaleString()}
              </div>
              <div className="text-white-75">Fotos Rechazadas</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-info">
            <CCardBody>
              <div className="fs-4 fw-semibold">
                {(analytics.totals.acceptanceRate * 100).toFixed(1)}%
              </div>
              <div className="text-white-75">Tasa de Aceptación</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Gráficos */}
      <CRow className="mb-4">
        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <strong>Razones de Rechazo</strong>
            </CCardHeader>
            <CCardBody>
              <Chart
                options={rejectionChartOptions}
                series={rejectionChartSeries}
                type="donut"
                height={300}
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <strong>Tendencia de Aceptación (Últimos 7 Días)</strong>
            </CCardHeader>
            <CCardBody>
              <Chart
                options={trendChartOptions}
                series={trendChartSeries}
                type="line"
                height={300}
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Tabla de detalles diarios */}
      <CCard>
        <CCardHeader>
          <strong>Detalle por Día</strong>
        </CCardHeader>
        <CCardBody>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Fecha</CTableHeaderCell>
                <CTableHeaderCell>Validaciones</CTableHeaderCell>
                <CTableHeaderCell>Aceptadas</CTableHeaderCell>
                <CTableHeaderCell>Rechazadas</CTableHeaderCell>
                <CTableHeaderCell>Tasa Aceptación</CTableHeaderCell>
                <CTableHeaderCell>Principal Rechazo</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {analytics.dailyAnalytics.map(day => {
                const topRejection = Object.entries(day.rejectionReasons || {})
                  .sort(([,a], [,b]) => (b as number) - (a as number))[0];

                return (
                  <CTableRow key={day.date}>
                    <CTableDataCell>{day.date}</CTableDataCell>
                    <CTableDataCell>{day.totalValidations}</CTableDataCell>
                    <CTableDataCell>
                      <span className="text-success fw-semibold">
                        {day.totalAccepted}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell>
                      <span className="text-danger fw-semibold">
                        {day.totalRejected}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CProgress
                        value={day.acceptanceRate * 100}
                        color={day.acceptanceRate > 0.8 ? 'success' : day.acceptanceRate > 0.6 ? 'warning' : 'danger'}
                      >
                        {(day.acceptanceRate * 100).toFixed(1)}%
                      </CProgress>
                    </CTableDataCell>
                    <CTableDataCell>
                      {topRejection && (
                        <CBadge color="warning">
                          {rejectionReasonLabels[topRejection[0]] || topRejection[0]}: {topRejection[1]}
                        </CBadge>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                );
              })}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </DashboardLayout>
  );
}
```

---

## ✅ Checklist de Implementación

### Backend (Azure Functions / Next.js API)
- [ ] Crear endpoint `POST /api/photo-quality/validate`
- [ ] Crear endpoint `GET /api/photo-quality/analytics`
- [ ] Crear container `QUALITY_ANALYTICS` en Cosmos DB
- [ ] Añadir campo `photoQuality` al schema de `SCANS` container
- [ ] Implementar lógica de agregación diaria
- [ ] Configurar índices en Cosmos DB para queries eficientes

### Android App
- [ ] Añadir dependencias (ML Kit, OpenCV opcional)
- [ ] Crear tabla `photo_quality_validations` en SQLite
- [ ] Implementar `PhotoQualityValidator.kt`
- [ ] Implementar `PhotoQualityDao.kt`
- [ ] Crear entidad `PhotoQualityValidation.kt`
- [ ] Integrar validación en `ScanViewModel.kt` (antes de anti-fraude)
- [ ] Crear `PhotoQualityRejectionDialog.kt`
- [ ] Configurar umbrales en archivo de configuración
- [ ] Añadir tests unitarios para cada validador
- [ ] Añadir tests de integración end-to-end

### Dashboard Web
- [ ] Crear página `CalidadFotosPage.tsx`
- [ ] Implementar gráficos con ApexCharts
- [ ] Añadir filtros por fecha y organización
- [ ] Crear componente de estadísticas resumidas
- [ ] Añadir tabla de detalles diarios
- [ ] Implementar exportación a CSV/Excel
- [ ] Añadir menú de navegación para acceder a la página

### Testing
- [ ] Test unitario: `BrightnessChecker` con fotos oscuras/claras/normales
- [ ] Test unitario: `BlurDetector` con fotos nítidas/borrosas
- [ ] Test unitario: `ResolutionChecker` con distintas resoluciones
- [ ] Test unitario: `TextDetector` con fotos con/sin texto
- [ ] Test de integración: Flujo completo de captura → validación → rechazo
- [ ] Test de integración: Flujo completo de captura → validación → aceptación
- [ ] Test de performance: Tiempo de validación < 2 segundos
- [ ] Test de usabilidad: Usuarios entienden feedback de rechazo

### Documentación
- [ ] Actualizar `ANDROID_SYNC_ARCHITECTURE.md` con validación de calidad
- [ ] Actualizar `COSMOS_DB_LOGISTICS_MODEL_PROMPT.md` con nuevo container
- [ ] Actualizar `LOGISTICS_FRONTEND_PROMPT.md` con nueva página
- [ ] Crear guía de configuración de umbrales
- [ ] Crear manual de troubleshooting para repartidores

---

## 🎯 KPIs de Éxito

1. **Tasa de Aceptación > 80%** (validaciones exitosas al primer intento)
2. **Tiempo de Validación < 2 segundos** (performance en dispositivo medio)
3. **Reducción de Disputas > 60%** (menos problemas de verificación)
4. **Tasa de Reintentos < 1.5** (promedio de intentos por foto aceptada)
5. **Satisfacción de Repartidores > 4.0/5.0** (encuesta post-implementación)

---

## 🔒 Consideraciones de Seguridad

1. **Privacidad**: Las imágenes solo se analizan localmente, no se envían métricas de calidad al servidor
2. **Performance**: Validación asíncrona para no bloquear UI
3. **Fallback**: Si validación falla por error técnico, permitir captura manual con advertencia
4. **Configuración Remota**: Umbrales ajustables desde dashboard para adaptar a diferentes condiciones
5. **Auditoría**: Todas las validaciones se registran para análisis posterior

---

## 📚 Referencias Técnicas

- **ML Kit Text Recognition**: https://developers.google.com/ml-kit/vision/text-recognition
- **OpenCV Laplacian**: https://docs.opencv.org/4.x/d5/db5/tutorial_laplace_operator.html
- **CameraX**: https://developer.android.com/training/camerax
- **Cosmos DB Indexing**: https://learn.microsoft.com/en-us/azure/cosmos-db/index-policy

---

**Estimación de Desarrollo**: 4-6 días
**Prioridad**: 🟡 IMPORTANTE
**Dependencias**: Sistema Anti-Fraude (debe ejecutarse DESPUÉS de validación de calidad)

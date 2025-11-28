import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/vehiculos/");
  },
  filename: function (req, file, cb) {
    cb(null, `${req.params.vehiculoId}_${Date.now()}_${file.originalname}`);
  }
});
const uploadVehiculoIcono = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "image/bmp",
      "image/gif",
      "image/svg+xml"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes"));
    }
  }
});

export default uploadVehiculoIcono;
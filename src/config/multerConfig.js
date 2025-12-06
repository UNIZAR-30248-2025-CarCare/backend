import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Para obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de almacenamiento: Dónde guardar y cómo nombrar el archivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // La carpeta debe existir en tu proyecto
    cb(null, path.join(__dirname, '../uploads/perfiles')); 
  },
  filename: (req, file, cb) => {
    // Nombrar el archivo usando el ID del usuario y la extensión original
    // Asume que el ID del usuario viene en req.user (si usas JWT) o en el cuerpo/parámetros.
    // Usaremos el ID de usuario del token JWT (req.user.id)
    const userId = req.user.id; 
    const extension = path.extname(file.originalname);
    cb(null, `user-${userId}-${Date.now()}${extension}`);
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 20 // Límite de 20MB
  }
});

// Middleware para la subida de una única imagen
const uploadProfilePhoto = upload.single('foto'); 

export default uploadProfilePhoto;
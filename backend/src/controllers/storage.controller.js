// src/controllers/storage.controller.js
// Genera URLs firmadas para los adjuntos de facturas.
// Usa supabaseAdmin para acceder a Storage privado.

import { supabaseAdmin } from '../config/supabase.js';
import { createError } from '../middleware/errorHandler.js';

const STORAGE_BUCKET = 'adjuntos-facturas';
const URL_EXPIRY_SECONDS = 3600; // 1 hora

/**
 * GET /api/storage/facturas/:factura_id/adjunto
 * Genera una URL firmada (1 hora) para el PDF adjunto de la factura.
 * Si no existe el archivo, retorna 404.
 */
export async function getUrlAdjunto(req, res, next) {
  try {
    const { factura_id } = req.params;

    // Listar archivos en el path de la factura
    const { data: archivos, error: errorList } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .list(`facturas/${factura_id}`, { limit: 1 });

    if (errorList) {
      return next(createError(500, 'Error al acceder al almacenamiento.', 'ERROR_STORAGE'));
    }

    if (!archivos || archivos.length === 0) {
      return next(createError(404, 'No hay adjunto para esta factura.', 'ADJUNTO_NO_ENCONTRADO'));
    }

    const nombreArchivo = archivos[0].name;
    const path = `facturas/${factura_id}/${nombreArchivo}`;

    const { data: signedData, error: errorSign } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, URL_EXPIRY_SECONDS);

    if (errorSign || !signedData?.signedUrl) {
      return next(createError(500, 'Error al generar la URL del adjunto.', 'ERROR_URL_FIRMADA'));
    }

    return res.json({
      url: signedData.signedUrl,
      expires_in: URL_EXPIRY_SECONDS,
      nombre_archivo: nombreArchivo,
    });
  } catch (err) {
    next(err);
  }
}

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function FileDropzone({ onFileSelect, maxSizeMB = 10, accept = { 'application/pdf': ['.pdf'] }, file, onRemove }) {
  const maxSize = maxSizeMB * 1024 * 1024;

  const onDrop = useCallback(
    (accepted, rejected) => {
      if (accepted.length > 0) onFileSelect(accepted[0]);
      if (rejected.length > 0) {
        const err = rejected[0].errors[0];
        if (err.code === 'file-too-large') {
          onFileSelect(null, `El archivo supera ${maxSizeMB}MB`);
        } else {
          onFileSelect(null, 'Tipo de archivo no permitido');
        }
      }
    },
    [onFileSelect, maxSizeMB]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  if (file) {
    const sizeKB = Math.round(file.size / 1024);
    const sizeTxt = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    return (
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
            <div>
              <p className="text-xs font-bold text-primary truncate max-w-[200px]">{file.name}</p>
              <p className="text-[10px] text-slate-500">{sizeTxt}</p>
            </div>
          </div>
          <button onClick={onRemove} type="button" className="text-error hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all
        ${isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-outline-variant/30 bg-white/50 hover:border-secondary-container/50 hover:bg-white'
        }`}
    >
      <input {...getInputProps()} />
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${isDragActive ? 'scale-110' : ''} bg-surface-container`}>
        <span className="material-symbols-outlined text-4xl text-primary/40">cloud_upload</span>
      </div>
      <p className="font-bold text-on-surface">
        {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra y suelta el PDF aquí'}
      </p>
      <p className="text-on-surface-variant text-xs mt-1 mb-4">Solo archivos PDF (Máx. {maxSizeMB}MB)</p>
      <button
        type="button"
        className="px-6 py-2 rounded-full border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all"
      >
        Seleccionar archivo
      </button>
    </div>
  );
}

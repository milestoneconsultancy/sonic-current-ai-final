package com.surajkhandagale.freemusic;

import android.content.ContentValues;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "MediaStoreSaver")
public class MediaStoreSaverPlugin extends Plugin {

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String fileName = call.getString("fileName");
        String mimeType = call.getString("mimeType");
        if (mimeType == null || mimeType.isEmpty()) {
            mimeType = "audio/mpeg";
        }
        String base64Data = call.getString("base64Data");

        if (fileName == null || base64Data == null) {
            call.reject("Missing fileName or base64Data");
            return;
        }

        try {
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }

            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ Scoped Storage (Public Downloads via MediaStore)
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                Uri uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);

                if (uri == null) {
                    call.reject("Failed to create MediaStore entry");
                    return;
                }

                try (OutputStream outputStream = getContext().getContentResolver().openOutputStream(uri)) {
                    if (outputStream == null) {
                        call.reject("Failed to open output stream");
                        return;
                    }
                    outputStream.write(bytes);
                    outputStream.flush();
                }

                values.clear();
                values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                getContext().getContentResolver().update(uri, values, null, null);

                JSObject ret = new JSObject();
                ret.put("uri", uri.toString());
                ret.put("size", bytes.length);
                call.resolve(ret);
            } else {
                // Pre-Android 10 (Android 9 and lower)
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }
                File file = new File(downloadsDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(file)) {
                    fos.write(bytes);
                    fos.flush();
                }

                // Trigger MediaScanner so file appears immediately in File Manager
                MediaScannerConnection.scanFile(
                    getContext(),
                    new String[]{file.getAbsolutePath()},
                    new String[]{mimeType},
                    null
                );

                JSObject ret = new JSObject();
                ret.put("uri", Uri.fromFile(file).toString());
                ret.put("size", file.length());
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("MediaStore save failed: " + e.getMessage(), e);
        }
    }
}

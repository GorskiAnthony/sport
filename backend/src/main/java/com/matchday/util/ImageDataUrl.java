package com.matchday.util;

import com.matchday.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.util.Arrays;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Every "image" field in the app (avatar, banner, team logo, sponsor logo) arrives from the
 * client as a data: URL built purely client-side via FileReader.readAsDataURL. The
 * accept="image/*" on the &lt;input&gt; is only a UI hint — nothing stops a caller from hitting
 * the API directly with an oversized payload or a non-image MIME type (e.g. image/svg+xml,
 * which can carry an inline &lt;script&gt; and isn't neutralised the way raster formats are), so
 * every write path must run through here rather than trust the browser.
 */
public final class ImageDataUrl {

    private static final Pattern DATA_URL = Pattern.compile("^data:image/(png|jpe?g|gif|webp);base64,([A-Za-z0-9+/=]+)$");

    private ImageDataUrl() {
    }

    public static void validate(String value, int maxBytes, String fieldLabel) {
        if (value == null || value.isBlank()) {
            return;
        }
        Matcher matcher = DATA_URL.matcher(value.trim());
        if (!matcher.matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    fieldLabel + " doit être une image PNG, JPEG, GIF ou WebP.");
        }

        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(matcher.group(2));
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, fieldLabel + " est corrompue.");
        }

        if (decoded.length > maxBytes) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    fieldLabel + " est trop volumineuse (max " + (maxBytes / 1_000_000) + " Mo).");
        }
        if (!matchesDeclaredFormat(decoded, matcher.group(1))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, fieldLabel + " n'est pas une image valide.");
        }
    }

    private static boolean matchesDeclaredFormat(byte[] data, String declared) {
        return switch (declared) {
            case "png" -> startsWith(data, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
            case "jpeg", "jpg" -> startsWith(data, 0xFF, 0xD8, 0xFF);
            case "gif" -> startsWith(data, 0x47, 0x49, 0x46, 0x38);
            case "webp" -> startsWith(data, 0x52, 0x49, 0x46, 0x46)
                    && data.length >= 12
                    && startsWith(Arrays.copyOfRange(data, 8, 12), 0x57, 0x45, 0x42, 0x50);
            default -> false;
        };
    }

    private static boolean startsWith(byte[] data, int... expected) {
        if (data.length < expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((data[i] & 0xFF) != expected[i]) {
                return false;
            }
        }
        return true;
    }
}

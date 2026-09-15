from io import BytesIO

from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import ExifTags, Image, ImageOps, ImageSequence


IMAGE_CONTENT_TYPES = {
    'GIF': 'image/gif',
    'JPEG': 'image/jpeg',
    'PNG': 'image/png',
    'WEBP': 'image/webp',
}
MAX_DECODED_IMAGE_PIXELS = 40_000_000
MAX_IMAGE_FRAMES = 200
SENSITIVE_IMAGE_INFO_KEYS = {
    'comment',
    'exif',
    'xmp',
    'XML:com.adobe.xmp',
}

ORIENTATION_TRANSPOSE_METHODS = {
    2: Image.Transpose.FLIP_LEFT_RIGHT,
    3: Image.Transpose.ROTATE_180,
    4: Image.Transpose.FLIP_TOP_BOTTOM,
    5: Image.Transpose.TRANSPOSE,
    6: Image.Transpose.ROTATE_270,
    7: Image.Transpose.TRANSVERSE,
    8: Image.Transpose.ROTATE_90,
}


def _remove_sensitive_metadata(image):
    for key in SENSITIVE_IMAGE_INFO_KEYS:
        image.info.pop(key, None)
    return image


def _apply_orientation(image, orientation):
    transpose_method = ORIENTATION_TRANSPOSE_METHODS.get(orientation)
    if transpose_method is not None:
        image = image.transpose(transpose_method)
    return _remove_sensitive_metadata(image)


def sanitize_uploaded_image(upload):
    upload.seek(0)
    source = Image.open(upload)
    image_format = source.format
    output = BytesIO()

    try:
        if image_format not in IMAGE_CONTENT_TYPES:
            raise ValueError('Formato de imagem não suportado.')

        frame_count = getattr(source, 'n_frames', 1)
        decoded_pixels = source.width * source.height * frame_count
        if frame_count > MAX_IMAGE_FRAMES or decoded_pixels > MAX_DECODED_IMAGE_PIXELS:
            raise ValueError('Imagem excede o limite de processamento seguro.')

        if getattr(source, 'is_animated', False):
            orientation = source.getexif().get(ExifTags.Base.Orientation, 1)
            frames = []
            durations = []
            for frame in ImageSequence.Iterator(source):
                durations.append(frame.info.get('duration', source.info.get('duration', 0)))
                frames.append(_apply_orientation(frame.copy(), orientation))

            save_options = {
                'save_all': True,
                'append_images': frames[1:],
                'duration': durations,
                'loop': source.info.get('loop', 0),
            }
            if image_format == 'WEBP':
                save_options.update({'quality': 95, 'method': 4})

            frames[0].save(output, format=image_format, **save_options)
        else:
            clean_image = _remove_sensitive_metadata(ImageOps.exif_transpose(source))
            save_options = {}
            if image_format == 'JPEG':
                if clean_image.mode not in ('RGB', 'L'):
                    clean_image = clean_image.convert('RGB')
                save_options = {'quality': 95, 'optimize': True}
            elif image_format == 'PNG':
                save_options = {'optimize': True}
            elif image_format == 'WEBP':
                save_options = {'quality': 95, 'method': 4}

            clean_image.save(output, format=image_format, **save_options)
    finally:
        source.close()

    output.seek(0)
    return InMemoryUploadedFile(
        output,
        getattr(upload, 'field_name', 'foto'),
        upload.name,
        IMAGE_CONTENT_TYPES[image_format],
        output.getbuffer().nbytes,
        None,
    )

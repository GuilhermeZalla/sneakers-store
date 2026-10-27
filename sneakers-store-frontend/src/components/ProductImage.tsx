import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

export function ProductImage({
    src,
    alt,
    width,
    height,
}: {
    src: string;
    alt: string;
    width: number | string;
    height: number | string;
}) {
    const [failed, setFailed] = useState(false);
    const { locale } = useLocale();
    useEffect(() => setFailed(false), [src]);
    if (failed || !src)
        return (
            <div
                className="image-fallback"
                role="img"
                aria-label={
                    alt + ' — ' + (locale === 'pt_BR' ? 'imagem indisponível' : 'image unavailable')
                }
            >
                <ImageOff size={32} aria-hidden="true" />
                <span>{locale === 'pt_BR' ? 'IMAGEM INDISPONÍVEL' : 'IMAGE UNAVAILABLE'}</span>
            </div>
        );
    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            width={width}
            height={height}
            onError={() => setFailed(true)}
        />
    );
}

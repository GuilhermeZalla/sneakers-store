import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { productImages } from '../lib/catalog';
import type { Product } from '../lib/store';
import { ProductImage } from './ProductImage';
import { Button, Modal } from './ui';

export function ProductGallery({ product }: { product: Product }) {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const images = productImages(product);
    const [selected, setSelected] = useState(0);
    const [open, setOpen] = useState(false);
    const [zoomed, setZoomed] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const frame = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (zoomed && frame.current) {
            frame.current.scrollLeft = (frame.current.scrollWidth - frame.current.clientWidth) / 2;
            frame.current.scrollTop = (frame.current.scrollHeight - frame.current.clientHeight) / 2;
        }
    }, [zoomed]);
    const src = images[selected] || '';
    const caption = pt
        ? `Imagem ${selected + 1} de ${images.length}`
        : `Image ${selected + 1} of ${images.length}`;
    function select(index: number) {
        setSelected(index);
        setZoomed(false);
    }
    return (
        <div className="product-gallery">
            <button
                ref={trigger}
                className="detail-image gallery-main"
                disabled={!src}
                aria-label={(pt ? 'Ampliar imagem de ' : 'Enlarge image of ') + product.name}
                onClick={() => {
                    setZoomed(false);
                    setOpen(true);
                }}
            >
                <ProductImage src={src} alt={product.name} width="700" height="700" />
                {!!src && (
                    <span className="gallery-enlarge">
                        {pt ? 'Ampliar imagem' : 'Enlarge image'} ↗
                    </span>
                )}
            </button>
            {images.length > 1 && (
                <div
                    className="gallery-thumbnails"
                    role="group"
                    aria-label={pt ? 'Fotos do produto' : 'Product images'}
                >
                    {images.map((image, index) => (
                        <button
                            key={image}
                            aria-pressed={selected === index}
                            aria-label={
                                pt
                                    ? `Ver imagem ${index + 1} de ${images.length}`
                                    : `View image ${index + 1} of ${images.length}`
                            }
                            onClick={() => select(index)}
                        >
                            <ProductImage src={image} alt="" width="80" height="80" />
                        </button>
                    ))}
                </div>
            )}
            <Modal
                open={open}
                onOpenChange={setOpen}
                title={product.name}
                closeLabel={pt ? 'Fechar imagem' : 'Close image'}
                className="product-zoom-modal"
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    trigger.current?.focus();
                }}
            >
                <div
                    onKeyDown={(event) => {
                        if (images.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key))
                            return;
                        event.preventDefault();
                        select(
                            (selected + (event.key === 'ArrowRight' ? 1 : -1) + images.length) %
                                images.length,
                        );
                    }}
                >
                    <div
                        ref={frame}
                        className={'product-zoom-frame' + (zoomed ? ' is-zoomed' : '')}
                        tabIndex={0}
                        aria-label={
                            pt
                                ? 'Imagem do produto; use a rolagem após ampliar'
                                : 'Product image; scroll after zooming'
                        }
                    >
                        <ProductImage src={src} alt={product.name} width="1100" height="1100" />
                    </div>
                    <div className="gallery-controls">
                        {images.length > 1 && (
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    select((selected - 1 + images.length) % images.length)
                                }
                            >
                                {pt ? 'Anterior' : 'Previous'}
                            </Button>
                        )}
                        <p role="status">
                            {images.length
                                ? caption
                                : pt
                                  ? 'Imagem indisponível'
                                  : 'Image unavailable'}
                        </p>
                        {images.length > 1 && (
                            <Button
                                variant="secondary"
                                onClick={() => select((selected + 1) % images.length)}
                            >
                                {pt ? 'Próxima' : 'Next'}
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            aria-pressed={zoomed}
                            onClick={() => setZoomed((value) => !value)}
                        >
                            {zoomed
                                ? pt
                                    ? 'Ajustar imagem'
                                    : 'Fit image'
                                : pt
                                  ? 'Ampliar 2×'
                                  : 'Zoom 2×'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

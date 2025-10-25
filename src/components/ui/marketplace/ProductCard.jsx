import React from 'react';
import { Button } from '@/components/ui/button';

const ProductCard = ({ product, onBuy, disabled, adminMode = false, onEdit, onDelete }) => {
  const { name, price, stock, imageUrl, description } = product;
  return (
    <div className="rounded-2xl glass-effect p-4 flex flex-col">
      <div className="w-full rounded-xl overflow-hidden mb-3 aspect-square bg-white/5">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : null}
      </div>
      <div className="flex-1">
        <h4 className="text-lg font-semibold">{name}</h4>
        <p className="text-sm text-gray-300 line-clamp-4">{description || '\u00A0'}</p>
      </div>
      {Array.isArray(product.tags) && product.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {product.tags.map((t) => (
            <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-white/10 border border-white/10 text-gray-200">{t}</span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-boreal-aqua font-bold">{price} pts</div>
        <div className="text-xs text-gray-400">Stock: {Number(stock ?? 0)}</div>
      </div>
      <Button className="mt-3" onClick={onBuy} disabled={disabled || Number(stock ?? 0) <= 0}>
        Canjear
      </Button>
      {adminMode && (
        <div className="mt-2 flex gap-2">
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={onEdit}>Editar</Button>
          <Button variant="destructive" onClick={onDelete}>Eliminar</Button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;

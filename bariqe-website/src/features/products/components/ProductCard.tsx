"use client"

import { ShoppingCart, Plus, Minus, Star, Heart } from "lucide-react"
import { Link } from "@/i18n/routing"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useCart } from "@/shared/hooks/useCart"
import { useFavoritesStore } from "@/shared/hooks/useFavoritesStore"
import toast from "react-hot-toast"
import type { Product as StoreProduct } from "@/lib/publicApiService"
import { Product } from "@/shared/types"
import { useLocale, useTranslations } from "next-intl"

interface ProductCardProps {
    product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
    const tCard = useTranslations('productCard');
    const local = useLocale();
    const { addItem } = useCart();

    // Favorites Store
    const { toggleItem, isFavorite } = useFavoritesStore();
    // Hydration fix for zustand persist
    const [isFav, setIsFav] = useState(false);
    // Subscribe to changes
    const isFavoriteItem = isFavorite(String(product._id));

    useEffect(() => {
        setIsFav(isFavoriteItem);
    }, [isFavoriteItem]);

    const [quantity, setQuantity] = useState(1);
    const [imageError, setImageError] = useState(false);

    const discount = Number(product.productDiscount || 0);
    const oldPrice = Number(product.productOldPrice || 0);
    const isValidOffer = discount > 0 && discount <= 100;

    const realPrice = isValidOffer
        ? oldPrice - (oldPrice * (discount / 100))
        : oldPrice;

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setQuantity(prev => prev + 1);
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (product.amount === 0) {
            toast.error(local === 'en' ? 'Out of stock' : 'نفذت الكمية');
            return;
        }
        const mapped: StoreProduct = {
            _id: String(product._id),
            productNameEn: product.productNameEn,
            productNameAr: product.productNameAr,
            productImage: product.productImage,
            productPrice: oldPrice, // Store original price for backend calculation
            productDiscount: discount, // Store the discount percentage
            // discountTiers: product.di || [],
        } as unknown as StoreProduct;
        addItem(mapped, quantity);
        toast.success(tCard('added'));
    };

    return (
        <div className="group w-full bg-white border border-gray-100 rounded-[20px] sm:rounded-[32px] p-2 sm:p-3 hover:shadow-xl transition-all duration-300 flex flex-col relative h-full">

            {/* Image Section */}
            <Link href={`/${product._id}`} className="block relative w-full aspect-[4/3] bg-gray-50 rounded-xl sm:rounded-2xl overflow-hidden mb-2 sm:mb-3">
                {/* Badges Container */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1.5 items-start">
                    {/* Discount Badge */}
                    {isValidOffer && (
                        <div className="bg-destructive text-white text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm">
                            {discount}% {local === 'en' ? 'OFF' : 'خصم'}
                        </div>
                    )}

                    {/* Best Seller Badge */}
                    {product.productMoreSale && (
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-lg shadow-amber-500/50 flex items-center gap-1 animate-pulse">
                            <Star size={10} className="sm:w-3 sm:h-3 fill-current" />
                            <span>{local === 'en' ? 'Best Seller' : 'الأكثر مبيعاً'}</span>
                        </div>
                    )}
                </div>

                {/* Favorite Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleItem(product);
                    }}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 p-1.5 sm:p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors duration-200 group/fav"
                >
                    <Heart
                        size={16}
                        className={`transition-colors duration-200 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover/fav:text-red-400'}`}
                    />
                </button>

                <Image
                    src={!product.productImage || imageError ? '/product-placeholder.png' : product.productImage}
                    alt={local === 'en' ? product.productNameEn : product.productNameAr}
                    width={400}
                    height={400}
                    className="rounded-xl sm:rounded-2xl hover:scale-105 duration-500 w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            </Link>

            {/* Content Section */}
            <div className="flex flex-col gap-2 sm:gap-3 px-1 flex-1">

                {/* Header: Title */}
                <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col w-full">
                        <Link href={`/${product._id}`}>
                            <h3 className="text-sm sm:text-lg font-bold text-gray-900 line-clamp-1 hover:text-primary transition-colors text-end">
                                {local === 'en' ? product.productNameEn : product.productNameAr}
                            </h3>
                        </Link>

                        <div className="flex items-center justify-end gap-1 mt-1 text-primary">
                            <span className="text-base sm:text-lg font-bold">{Number(realPrice.toFixed(2))}</span>
                            <span className="text-[10px] sm:text-xs icon-saudi_riyal_new"></span>
                        </div>
                        {isValidOffer && (
                            <div className="flex items-center justify-end gap-1 text-gray-400 text-[10px] sm:text-xs line-through">
                                <span>{Number(oldPrice.toFixed(2))}</span>
                                <span className="icon-saudi_riyal_new"></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quantity + Details Row */}
                <div className="flex items-center justify-end mt-auto pt-2">
                    {/* Quantity Selector - Compact on mobile */}
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-full w-24 sm:w-32 h-8 sm:h-10 px-1 shadow-sm">
                        <button
                        disabled={product.amount === 0}
                            onClick={handleIncrement}
                            className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary/90 transition-colors ${product.amount === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20'}`}
                        >
                            <Plus size={14} className="sm:w-4 sm:h-4" />
                        </button>

                        <span className="font-semibold text-gray-700 w-6 sm:w-8 text-center text-xs sm:text-base">{quantity}</span>

                        <button
                            onClick={handleDecrement}
                            className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-colors ${quantity > 1 ? 'bg-blue-50 text-primary hover:bg-blue-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            <Minus size={14} className="sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>

                {/* Footer Action Row */}
                <div className="flex items-center gap-2 sm:gap-4 pt-1">
                    <button
                        onClick={handleAddToCart}
                        disabled={product.amount === 0}
                        className={`flex-1 h-9 sm:h-11 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 text-xs sm:text-sm ${
                            product.amount === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20'
                        }`}
                    >
                        <ShoppingCart size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>{product.amount === 0 ? (local === 'en' ? 'Out of Stock' : 'نفذت الكمية') : tCard('addToCart')}</span>
                    </button>

                    <Link
                        href={`/${product._id}`}
                        className="text-gray-500 text-xs sm:text-sm font-medium underline underline-offset-4 hover:text-primary transition-colors whitespace-nowrap hidden lg:block"
                    >
                        {local === 'en' ? 'View Details' : 'عرض التفاصيل'}
                    </Link>
                </div>

            </div>
        </div>
    )
}

export default ProductCard;

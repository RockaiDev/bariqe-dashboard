'use client'
import { useLocale, useTranslations } from "next-intl";
import { useQueryState } from 'nuqs'



import { useCrud } from "@/shared/hooks/useCrud"
import Loading from "@/app/loading"
import LoadingComponent from "@/shared/components/LoadingComponent"
import CustomBreadcrumb from "@/shared/components/CustomBreadcrumb"
import ProductCard from "@/features/products/components/ProductCard"
import CustomButton from "@/shared/components/CustomButton"
import Banner from "./_components/Banner"
import SearchCom from "./_components/SearchCom"

import { Product } from "@/shared/types"


import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/ui/pagination"
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { X, Filter, Search, ChevronLeft, ChevronRight, Star, Tag, Package } from "lucide-react"

const AllProducts = () => {

  const t = useTranslations('allProducts');
  const local = useLocale()

  const [search, setSearch] = useQueryState('search', { history: 'push', shallow: true });
  const [category, setCategory] = useQueryState('category', { history: 'push', shallow: true });
  const [page, setPage] = useQueryState('page', { history: 'push', shallow: true });
  const [bestSellers, setBestSellers] = useQueryState('bestSellers', { history: 'push', shallow: true });
  const [onSale, setOnSale] = useQueryState('onSale', { history: 'push', shallow: true });
  const [inStock, setInStock] = useQueryState('inStock', { history: 'push', shallow: true });

  // Construct Queries for Server-Side Filtering
  const queries = useMemo(() => {
    const q = [];
    if (category) {
      q.push(['productCategory', '==', category]);
    }
    if (search) {
      q.push([local === 'en' ? 'productNameEn' : 'productNameAr', 'contains', search]);
    }
    if (bestSellers === 'true') {
      q.push(['productMoreSale', '==', true]);
    }
    if (onSale === 'true') {
      q.push(['productDiscount', '>', 0]);
    }
    if (inStock === 'true') {
      q.push(['amount', '>', 0]);
    }
    return q;
  }, [category, search, local, bestSellers, onSale, inStock]);



  // Fetch Products with Server-Side Filtering
  const { list } = useCrud('public/products', {
    page: page || 1,
    perPage: 12,
    queries: JSON.stringify(queries),
  });

  const { list: categoriesList } = useCrud('public/categories', { limit: 1000 });

  const products = list.data?.data || [];
  const allCategories = categoriesList.data?.data || [];
  // const totalResults = list.data?.pagination?.total || 0; 

  const filteredCategories = useMemo(() => {
    if (!allCategories.length) return [];
    return allCategories.filter((el) => el.categoryStatus === true);
  }, [allCategories]);


  if (list.isLoading && !list.data) return <Loading />

  const isFiltering = !!search || !!category || !!bestSellers || !!onSale || !!inStock;

  return (
    <section className="pb-8 overflow-x-hidden bg-slate-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto my-3 px-4 ">
        <CustomBreadcrumb items={[
          { label: t('breadcrumb') },
        ]} />
      </div>
      <Banner />

      <div className="max-w-7xl mx-auto px-4 my-8">

        {/* Controls Header - Responsive: Column on mobile, Row on desktop */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">

          {/* Search & Count */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="w-full sm:w-auto">
              <SearchCom onSearchChange={(value) => {
                setSearch(value || null);
                setPage(null);
              }} />
            </div>

            {list.data && (
              <span className="text-sm text-slate-500 font-medium whitespace-nowrap hidden sm:block">
                {list.data.count} {local === 'en' ? 'Products Found' : 'منتج'}
              </span>
            )}
          </div>

          {/* Filter Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {/* Filter Toggles */}
            <button
              onClick={() => {
                setBestSellers(bestSellers === 'true' ? null : 'true');
                setPage(null);
              }}
              className={`
                shrink-0 h-11 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${bestSellers === 'true'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-200 ring-2 ring-amber-400 ring-offset-1'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-400 hover:text-amber-600'}
              `}
            >
              <Star className={`w-4 h-4 ${bestSellers === 'true' ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{local === 'en' ? 'Best Sellers' : 'الأكثر مبيعاً'}</span>
            </button>

            <button
              onClick={() => {
                setOnSale(onSale === 'true' ? null : 'true');
                setPage(null);
              }}
              className={`
                shrink-0 h-11 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${onSale === 'true'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200 ring-2 ring-rose-400 ring-offset-1'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-rose-400 hover:text-rose-600'}
              `}
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">{local === 'en' ? 'On Sale' : 'تخفيضات'}</span>
            </button>

            <button
              onClick={() => {
                setInStock(inStock === 'true' ? null : 'true');
                setPage(null);
              }}
              className={`
                shrink-0 h-11 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${inStock === 'true'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 ring-2 ring-emerald-400 ring-offset-1'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-400 hover:text-emerald-600'}
              `}
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">{local === 'en' ? 'In Stock' : 'متوفر'}</span>
            </button>

            {isFiltering && (
              <CustomButton
                onClick={() => {
                  setSearch(null);
                  setCategory(null);
                  setBestSellers(null);
                  setOnSale(null);
                  setInStock(null);
                  setPage(null);
                }}
                className="shrink-0 h-11 px-4 text-red-500 bg-red-50 hover:bg-red-100 border-none rounded-xl"
                title={local === 'en' ? "Clear Filters" : "مسح التصنيفات"}
              >
                <X className="w-5 h-5" />
              </CustomButton>
            )}
          </div>
        </div>

        {/* Categories Bar - Sticky & Glassmorphism */}
        <div className="sticky top-0 sm:top-[70px] z-30 -mx-4 px-4 py-3 mb-8 bg-white/90 backdrop-blur-xl border-y border-slate-100/80 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-slate-800">{local === 'en' ? 'Categories' : 'التصنيفات'}</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-hide">
            {categoriesList.isLoading ? <LoadingComponent /> : (
              <>
                <button
                  onClick={() => {
                    setCategory(null);
                    setPage(null);
                  }}
                  className={`
                      shrink-0 px-5 py-2 rounded-full text-xs sm:text-sm transition-all duration-200 whitespace-nowrap
                      ${!category
                      ? 'bg-primary text-white ring-1 ring-primary ring-offset-[3px] shadow-md font-bold scale-[1.02]'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-primary/50 hover:text-primary font-medium'}
                    `}
                >
                  {local === 'en' ? 'All Products' : 'جميع المنتجات'}
                </button>

                {filteredCategories.map((el) => (
                  <button
                    key={el._id}
                    onClick={() => {
                      setCategory(el._id);
                      setPage(null);
                    }}
                    className={`
                        shrink-0 px-5 py-2 rounded-full text-xs sm:text-sm transition-all duration-200 whitespace-nowrap
                        ${category === el._id
                        ? 'bg-primary text-white ring-1 ring-primary ring-offset-[3px] shadow-md font-bold scale-[1.02]'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-primary/50 hover:text-primary font-medium'}
                      `}
                  >
                    {local === 'en' ? el.categoryNameEn : el.categoryNameAr}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Product Grid - Responsive Columns */}
        <div className="min-h-[50vh] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {products.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-lg font-medium">{local === 'en' ? 'No products found' : 'لا توجد منتجات مطابقة'}</p>
              {isFiltering && (
                <button onClick={() => {
                  setSearch(null);
                  setCategory(null);
                  setBestSellers(null);
                  setOnSale(null);
                  setInStock(null);
                }} className="mt-2 text-primary hover:underline">
                  {local === 'en' ? 'Clear active filters' : 'مسح الفلاتر الحالية'}
                </button>
              )}
            </div>
          ) : (
            products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          )}
        </div>
      </div>

      {list.data?.pagination && list.data.pagination.totalPages > 1 && (
        <Pagination className="mt-12 mb-8">
          <PaginationContent className="flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 bg-white shadow-lg shadow-slate-200/50 rounded-full px-4 py-2 sm:px-6 sm:py-3 w-fit mx-auto border border-slate-100 transition-all duration-300">
            {/* Previous Button - Logic reversed for RTL if desired, but typically:
                LTR: < Prev (Left Arrow)
                RTL: > السابق (Right Arrow)
            */}
            <PaginationItem>
              <PaginationLink
                className={`gap-1 px-2.5 cursor-pointer ${!list.data.pagination.prevPage ? "pointer-events-none opacity-50" : ""}`}
                onClick={() => {
                  if (list.data?.pagination.prevPage) {
                    setPage(list.data.pagination.prevPage.toString());
                  }
                }}
                aria-label="Previous Page"
              >
                {local === 'en' ? (
                  <>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:block">Previous</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <span className="hidden sm:block">السابق</span>
                  </>
                )}
              </PaginationLink>
            </PaginationItem>

            {renderPaginationItems(
              list.data.pagination.totalPages,
              Number(page) || 1,
              (p) => setPage(p.toString())
            )}

            {/* Next Button */}
            <PaginationItem>
              <PaginationLink
                className={`gap-1 px-2.5 cursor-pointer ${!list.data.pagination.nextPage ? "pointer-events-none opacity-50" : ""}`}
                onClick={() => {
                  if (list.data?.pagination.nextPage) {
                    setPage(list.data.pagination.nextPage.toString());
                  }
                }}
                aria-label="Next Page"
              >
                {local === 'en' ? (
                  <>
                    <span className="hidden sm:block">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:block">التالي</span>
                    <ChevronLeft className="h-4 w-4" />
                  </>
                )}
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

    </section>
  )
}

// Helper function for pagination logic
const renderPaginationItems = (
  totalPages: number,
  currentPage: number,
  setPage: (page: number) => void
) => {
  const items = [];
  const maxVisible = 5; // Configurable: max buttons to show before using ellipsis

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setPage(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
  } else {
    // Always show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          isActive={currentPage === 1}
          onClick={() => setPage(1)}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Show ellipsis if current page is far from start
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setPage(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Show ellipsis if current page is far from end
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page
    items.push(
      <PaginationItem key={totalPages}>
        <PaginationLink
          isActive={currentPage === totalPages}
          onClick={() => setPage(totalPages)}
          className="cursor-pointer"
        >
          {totalPages}
        </PaginationLink>
      </PaginationItem>
    );
  }
  return items;
};

export default AllProducts

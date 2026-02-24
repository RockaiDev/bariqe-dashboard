// export interface Product {
//   id: string;
//   image:string,
//     title:string,
//     price:number,
//     offerPrice?:number,
//     rate:number,
//     rateCount:number,
//     productAmount:number
// }



export interface ProductCategory {
  _id: string;
  categoryNameAr: string;
  categoryNameEn: string;
  categoryStatus: boolean;
}

export interface Product {
  _id: string;
  productNameAr: string;
  productNameEn: string;
  productDescriptionAr: string;
  productDescriptionEn: string;
  productOldPrice: number;
  productDiscount: number;
  productImage: string;
  productMoreSale: boolean;
  moreSale: boolean;
  amount: number;
  productCategory: ProductCategory;
  createdAt: string;
  updatedAt: string;
  productOptions: any[];
  __v: number;
}

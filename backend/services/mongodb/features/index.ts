import { Model, FilterQuery, SortOrder, UpdateQuery } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Support types like in FirebaseFeatures
type WhereTuple = [field: string, op: string, value: any];
type SortTuple = [field: string, dir?: SortOrder];

// NEW: Support object format for sorts
interface SortObject {
  field: string;
  direction: 'asc' | 'desc';
}

// Helper: convert query params from string (like "?queries=[...]")
function asTupleArray<T extends any[]>(
  val: unknown,
  eachLenMin: number,
  fallback: T[]
): T[] {
  let arr: unknown = val;
  if (typeof val === "string") {
    try {
      // فك الـ URL encoding أولاً
      let decodedVal = decodeURIComponent(val);
      
      // إزالة الـ quotes الزائدة إذا كانت موجودة
      if (decodedVal.startsWith('"') && decodedVal.endsWith('"')) {
        decodedVal = decodedVal.slice(1, -1);
      }
      
      // إزالة الـ escape characters
      decodedVal = decodedVal.replace(/\\"/g, '"');
      
      arr = JSON.parse(decodedVal);
    } catch {
      return fallback;
    }
  }
  if (!Array.isArray(arr)) return fallback;
  return (arr as unknown[]).filter(
    (x) =>
      Array.isArray(x) &&
      (x as any[]).length >= eachLenMin &&
      typeof (x as any[])[0] === "string"
  ) as T[];
}

// NEW: Helper function to parse sorts (supports both object and tuple formats)
function parseSorts(val: unknown): SortTuple[] {
  let arr: unknown = val;
  
  // Handle string input (URL encoded)
  if (typeof val === "string") {
    try {
      let decodedVal = decodeURIComponent(val);
      
      if (decodedVal.startsWith('"') && decodedVal.endsWith('"')) {
        decodedVal = decodedVal.slice(1, -1);
      }
      
      decodedVal = decodedVal.replace(/\\"/g, '"');
      arr = JSON.parse(decodedVal);
    } catch (error) {
      console.error("Failed to parse sorts string:", error);
      return [];
    }
  }
  
  if (!Array.isArray(arr)) return [];
  
  // Convert to SortTuple format
  return arr.map((item): SortTuple | null => {
    // Handle object format: {field: "name", direction: "asc"}
    if (typeof item === "object" && item !== null && "field" in item) {
      const sortObj = item as SortObject;
      return [sortObj.field, sortObj.direction as SortOrder];
    }
    
    // Handle tuple format: ["name", "asc"]
    if (Array.isArray(item) && item.length >= 1 && typeof item[0] === "string") {
      return [item[0], (item[1] as SortOrder) || "asc"];
    }
    
    return null;
  }).filter((item): item is SortTuple => item !== null);
}

// Make string → correct JS type
function coerceValue(v: any) {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null") return null;
  if (s === "undefined") return undefined;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (/^\d{4}-\d{2}-\d{2}T.*Z?$/.test(s)) return new Date(s);
  return v;
}

export default abstract class MongooseFeatures {
  // 🔹 Pagination & filtering
  public async PaginateHandler<T>(
    model: Model<T>,
    perPage: number = 15,
    currentPage: number = 1,
    sortsIn: Array<SortTuple> | Array<SortObject> | string = [],
    queriesIn: Array<WhereTuple> | string = []
  ) {
    try {
      // Handle queries
      const queries = asTupleArray<WhereTuple>(queriesIn, 3, []);
      
      // Handle sorts with new parser
      const sorts = parseSorts(sortsIn);
      
      console.log("queries", queries);
      console.log("parsed sorts", sorts);
      
      const filter: FilterQuery<T> = {};
      const conditions: any[] = [];

      for (const [field, op, rawValue] of queries) {
        const value = coerceValue(rawValue);
        
        // ✅ التعامل مع $or custom operator
        if (field === '$or' && op === 'custom' && Array.isArray(rawValue)) {
          const orConditions = rawValue.map(([subField, subOp, subValue]: any) => {
            const processedValue = coerceValue(subValue);
            switch (subOp) {
              case 'regex':
                return { [subField]: { $regex: processedValue, $options: "i" } };
              case '==':
                return { [subField]: processedValue };
              case 'contains':
                return { [subField]: { $regex: processedValue, $options: "i" } };
              default:
                return { [subField]: processedValue };
            }
          });
          conditions.push({ $or: orConditions });
          continue;
        }

        // التعامل مع العمليات العادية
        switch (op) {
          case "==":
            conditions.push({ [field]: value });
            break;
          case "!=":
            conditions.push({ [field]: { $ne: value } });
            break;
          case ">":
            conditions.push({ [field]: { $gt: value } });
            break;
          case ">=":
            conditions.push({ [field]: { $gte: value } });
            break;
          case "<":
            conditions.push({ [field]: { $lt: value } });
            break;
          case "<=":
            conditions.push({ [field]: { $lte: value } });
            break;
          case "in":
            conditions.push({ [field]: { $in: Array.isArray(value) ? value : [value] } });
            break;
          case "not-in":
            conditions.push({ [field]: { $nin: Array.isArray(value) ? value : [value] } });
            break;
        
          case "regex":
          case "contains":
            conditions.push({ [field]: { $regex: value, $options: "i" } });
            break;
          case "starts-with":
            conditions.push({ [field]: { $regex: `^${value}`, $options: "i" } });
            break;
          case "ends-with":
            conditions.push({ [field]: { $regex: `${value}$`, $options: "i" } });
            break;
          case "not-contains":
            conditions.push({ [field]: { $not: { $regex: value, $options: "i" } } });
            break;
          // ✅ إضافة text search
          case "text":
            conditions.push({ $text: { $search: value } });
            break;
          // ✅ إضافة exists check
          case "exists":
            conditions.push({ [field]: { $exists: Boolean(value) } });
            break;
          case "not-exists":
            conditions.push({ [field]: { $exists: !Boolean(value) } });
            break;
          // ✅ إضافة array operations
          case "array-contains":
            conditions.push({ [field]: { $elemMatch: { $eq: value } } });
            break;
          case "array-contains-any":
            conditions.push({ [field]: { $in: Array.isArray(value) ? value : [value] } });
            break;
          default:
            throw new Error(`Unsupported operator: ${op}`);
        }
      }

      // بناء الـ final filter
      if (conditions.length > 0) {
        if (conditions.length === 1) {
          Object.assign(filter, conditions[0]);
        } else {
          (filter as any).$and = conditions;
        }
      }

      console.log("Final MongoDB filter:", JSON.stringify(filter, null, 2));

      // Handle sort - IMPROVED SORTING LOGIC
      const sortObj: Record<string, SortOrder> = {};
      
      for (const [field, dir] of sorts) {
        // Handle nested field sorting (e.g., "productCategory.categoryName")
        sortObj[field] = dir || "asc";
      }
      
      console.log("Final MongoDB sort:", JSON.stringify(sortObj, null, 2));

      const page = Math.max(1, Number(currentPage) || 1);
      const size = Math.max(1, Number(perPage) || 15);
      const skip = (page - 1) * size;

      // Build the query
      let query = model.find(filter);
      
      // Apply sorting if exists
      if (Object.keys(sortObj).length > 0) {
        query = query.sort(sortObj);
      }
      
      // Apply pagination
      query = query.skip(skip).limit(size);

      const [data, count] = await Promise.all([
        query.exec(),
        model.countDocuments(filter),
      ]);

      const totalPages = Math.max(1, Math.ceil(count / size));
      const nextPage = page < totalPages ? page + 1 : null;
      const prevPage = page > 1 ? page - 1 : null;

      return {
        data,
        count,
        pagination: {
          currentPage: page,
          perPage: size,
          totalPages,
          nextPage,
          prevPage,
        },
      };
    } catch (err) {
      console.error("Error in PaginateHandler:", err);
      throw new Error("Failed to paginate data");
    }
  }

  // 🔹 Get one document
  public async getDocument<T>(model: Model<T>, id: string) {
    const doc = await model.findById(id);
    if (!doc) throw new Error(`Document with ID ${id} not found`);
    return doc;
  }

  // 🔹 Add new document
  public async addDocument<T>(model: Model<T>, body: Record<string, any>) {
    const id = uuidv4(); // optional uuid (Mongo has _id itself)
    const now = new Date();
    const doc = new model({
       id: body.id ?? uuidv4(),
      ...body,
      createdAt: now,
      updatedAt: now,
    });
    await doc.save();
    return doc;
  }

  // 🔹 Edit document
  public async editDocument<T>(
    model: Model<T>,
    id: string,
    body: UpdateQuery<T>
  ) {
    const doc = await model.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );
    if (!doc) throw new Error(`Document with ID ${id} not found`);
    return doc;
  }

  // 🔹 Delete document
  public async deleteDocument<T>(model: Model<T>, id: string) {
    const doc = await model.findByIdAndDelete(id);
    if (!doc) throw new Error(`Document with ID ${id} not found`);
    return { id, message: `Document with id: ${id} was deleted!` };
  }
}
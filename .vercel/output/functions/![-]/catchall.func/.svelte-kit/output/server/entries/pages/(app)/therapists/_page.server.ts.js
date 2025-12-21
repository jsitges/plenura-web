import { a as getCategories, b as getServicesByCategory, s as searchTherapists } from "../../../../chunks/therapist.service.js";
const load = async ({ locals, url }) => {
  const { supabase } = locals;
  const categoryId = url.searchParams.get("category") ?? void 0;
  const serviceId = url.searchParams.get("service") ?? void 0;
  const minPrice = url.searchParams.get("minPrice") ? Number(url.searchParams.get("minPrice")) : void 0;
  const maxPrice = url.searchParams.get("maxPrice") ? Number(url.searchParams.get("maxPrice")) : void 0;
  const minRating = url.searchParams.get("rating") ? Number(url.searchParams.get("rating")) : void 0;
  const query = url.searchParams.get("q") ?? void 0;
  const [categories, services, therapists] = await Promise.all([
    getCategories(supabase),
    getServicesByCategory(supabase, categoryId),
    searchTherapists(supabase, {
      categoryId,
      serviceId,
      minPrice,
      maxPrice,
      minRating,
      query
    })
  ]);
  return {
    categories,
    services,
    therapists,
    filters: {
      categoryId,
      serviceId,
      minPrice,
      maxPrice,
      minRating,
      query
    }
  };
};
export {
  load
};

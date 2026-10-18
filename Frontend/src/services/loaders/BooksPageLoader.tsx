import apiConfig from "../../../../shared/api-config.json";

export default async function BooksPageLoader() {
  const response = await fetch(
    `${apiConfig.apiPrefix}${apiConfig.api.books}`,
  );
  if (!response.ok) {
    throw response;
  }
  return response.json();
}
import { fetchWithAuth } from "./fetchWithAuth";
import { getApiUrl } from "../config/api";

export async function searchFiles(params: { searchTerm?: string; tags?: string[]; fileType?: string }) {
  const searchParams = new URLSearchParams();
  if (params.searchTerm) searchParams.append("searchTerm", params.searchTerm);
  if (params.tags && params.tags.length > 0) searchParams.append("tags", params.tags.join(","));
  if (params.fileType) searchParams.append("fileType", params.fileType);
  
  const response = await fetchWithAuth(getApiUrl(`/api/v1/Files?${searchParams.toString()}`));
  if (!response.ok) throw new Error("Ошибка поиска файлов");
  return response.json();
}

export async function getFile(id: string) {
  const response = await fetchWithAuth(getApiUrl(`/api/v1/Files/${id}`));
  if (!response.ok) throw new Error("Файл не найден");
  return response.json();
}

export async function downloadFile(url: string) {
  const response = await fetchWithAuth(url);
  if (!response.ok) throw new Error("Ошибка скачивания файла");
  return response.blob();
}

export async function deleteFile(id: string) {
  return fetchWithAuth(getApiUrl(`/api/v1/Files/${id}`), { method: "DELETE" });
}

export async function updateFileTags(id: string, tags: string[]) {
  const response = await fetchWithAuth(getApiUrl(`/api/v1/Files/${id}/tags`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ tags })
  });
  if (!response.ok) throw new Error("Ошибка при обновлении тегов");
  return response.text();
}

export async function addToFavorites(id: string) {
  const response = await fetchWithAuth(getApiUrl(`/api/v1/Files/${id}/favorite`), {
    method: "POST"
  });
  if (!response.ok) throw new Error("Ошибка при добавлении в избранное");
  return response.text();
}

export async function removeFromFavorites(id: string) {
  const response = await fetchWithAuth(getApiUrl(`/api/v1/Files/${id}/favorite`), {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Ошибка при удалении из избранного");
  return response.text();
}

export async function searchTags(query: string, limit: number = 10) {
  const params = new URLSearchParams();
  params.append("q", query);
  params.append("limit", limit.toString());
  const response = await fetchWithAuth(getApiUrl(`/api/v1/Tags/search?${params.toString()}`));
  if (!response.ok) throw new Error("Ошибка поиска тегов");
  return response.json();
}

export async function createShareLink(fileId: string, password?: string, expiresAt?: Date) {
  const body: any = {};
  if (password) body.password = password;
  if (expiresAt) body.expiresAt = expiresAt.toISOString();
  
  const response = await fetchWithAuth(getApiUrl(`/api/v1/Files/${fileId}/share-link`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error("Ошибка создания публичной ссылки");
  return response.json();
}

export async function deleteShareLink(fileId: string) {
  const response = await fetchWithAuth(getApiUrl(`/api/v1/Files/${fileId}/share-link`), {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Ошибка удаления публичной ссылки");
  return response.text();
}

export async function updateFileMetadata(fileId: string, name?: string, description?: string) {
  const body: any = {};
  if (name) body.name = name;
  if (description !== undefined) body.description = description;
  
  const response = await fetchWithAuth(getApiUrl(`/api/v1/Files/${fileId}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error("Ошибка обновления файла");
  return response.json();
} 
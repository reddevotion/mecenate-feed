import { getJson } from "@/api/http";
import { PostsResponse, Tier } from "@/types/posts";

export interface GetPostsParams {
  cursor?: string;
  limit?: number;
  tier?: Tier;
  simulateError?: boolean;
}

export async function getPostsPage(params: GetPostsParams = {}) {
  const response = await getJson<PostsResponse>("/posts", {
    cursor: params.cursor,
    limit: params.limit ?? 10,
    tier: params.tier,
    simulate_error: params.simulateError,
  });

  return response.data;
}

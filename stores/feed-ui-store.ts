import { makeAutoObservable } from "mobx";

export type FeedFilter = "all" | "free" | "paid";

class FeedUiStore {
  selectedFilter: FeedFilter = "all";
  isRefreshing = false;
  inlineError: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setFilter(filter: FeedFilter) {
    this.selectedFilter = filter;
  }

  setRefreshing(value: boolean) {
    this.isRefreshing = value;
  }

  setInlineError(message: string | null) {
    this.inlineError = message;
  }
}

export const feedUiStore = new FeedUiStore();

import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getPostsPage } from "@/api/posts";
import { tokens } from "@/constants/design-tokens";
import { feedUiStore, type FeedFilter } from "@/stores/feed-ui-store";
import { Post } from "@/types/posts";

const EMPTY_MESSAGE = "По вашему запросу ничего не найдено";

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "free", label: "Бесплатные" },
  { key: "paid", label: "Платные" },
];

const pageSize = 10;

function CountChip({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
}) {
  return (
    <View style={styles.countChip}>
      <Ionicons name={icon} size={14} color={tokens.colors.iconMuted} />
      <Text style={styles.countChipText}>{value}</Text>
    </View>
  );
}

function FilterTabs({ selectedFilter }: { selectedFilter: FeedFilter }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.filtersWrap,
        { marginTop: insets.top + tokens.spacing.sm },
      ]}
    >
      {FILTERS.map((filter) => {
        const isActive = selectedFilter === filter.key;

        return (
          <Pressable
            key={filter.key}
            onPress={() => feedUiStore.setFilter(filter.key)}
            style={[styles.filterButton, isActive && styles.filterButtonActive]}
          >
            <Text
              style={[
                styles.filterButtonText,
                isActive && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PrimaryButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.primaryButtonPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

function EmptyState({ onGoHome }: { onGoHome: () => void }) {
  return (
    <View style={styles.emptyStateContainer}>
      <Image
        source={require("@/assets/images/feed-empty-illustration.png")}
        style={styles.illustration}
        contentFit="contain"
      />

      <Text style={styles.stateMessage}>{EMPTY_MESSAGE}</Text>
      <PrimaryButton title="На главную" onPress={onGoHome} />
    </View>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.authorRow}>
          <View style={[styles.skeleton, styles.skeletonAvatar]} />
          <View style={[styles.skeleton, styles.skeletonAuthor]} />
        </View>
      </View>

      <View style={[styles.skeleton, styles.skeletonMedia]} />
      <View style={styles.cardContent}>
        <View style={[styles.skeleton, styles.skeletonTitle]} />
        <View style={[styles.skeleton, styles.skeletonPreview]} />

        <View style={styles.actionsRow}>
          <View style={[styles.skeleton, styles.skeletonChip]} />
          <View style={[styles.skeleton, styles.skeletonChip]} />
        </View>
      </View>
    </View>
  );
}

function PostCard({
  post,
  isExpanded,
  onExpand,
}: {
  post: Post;
  isExpanded: boolean;
  onExpand: (postId: string) => void;
}) {
  const isPaid = post.tier === "paid";
  const fullText = post.body?.trim() ? post.body : post.preview;
  const canExpand = fullText.length > 120;

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.authorRow}>
          <Image
            source={post.author.avatarUrl}
            style={styles.avatar}
            contentFit="cover"
          />
          <Text style={styles.authorName}>{post.author.displayName}</Text>
        </View>
      </View>

      {isPaid ? (
        <View style={styles.paidMediaWrap}>
          <View style={styles.paidImageWrap}>
            <Image
              source={post.coverUrl}
              style={styles.coverImage}
              blurRadius={24}
              contentFit="cover"
            />

            <View style={styles.lockedOverlay}>
              <View style={styles.lockedBlock}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={tokens.colors.textOnPrimary}
                />
                <Text style={styles.lockedText}>
                  Контент скрыт пользователем. Доступ откроется после доната.
                </Text>
                <PrimaryButton title="Отправить донат" onPress={() => {}} />
              </View>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.paidTextSkeletonWrap}>
              <View style={[styles.skeleton, styles.skeletonTitle]} />
              <View style={[styles.skeleton, styles.skeletonPreview]} />
            </View>
          </View>
        </View>
      ) : (
        <>
          <Image
            source={post.coverUrl}
            style={styles.coverImage}
            contentFit="cover"
          />

          <View style={styles.cardContent}>
            <Text numberOfLines={1} style={styles.postTitle}>
              {post.title}
            </Text>

            <View>
              <Text
                numberOfLines={isExpanded ? undefined : 2}
                style={styles.previewText}
              >
                {fullText}
              </Text>

              {canExpand && !isExpanded ? (
                <Pressable
                  style={styles.expandButtonWrap}
                  onPress={() => onExpand(post.id)}
                >
                  <Text style={styles.expandButtonText}>Показать еще</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </>
      )}

      <View style={styles.cardContent}>
        <View style={styles.actionsRow}>
          <CountChip
            icon={post.isLiked ? "heart" : "heart-outline"}
            value={post.likesCount}
          />
          <CountChip icon="chatbubble-outline" value={post.commentsCount} />
        </View>
      </View>
    </View>
  );
}

const FeedScreen = observer(function FeedScreen() {
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>(
    {},
  );

  const selectedFilter = feedUiStore.selectedFilter;
  const selectedTier = selectedFilter === "all" ? undefined : selectedFilter;

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    refetch,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts-feed", selectedTier],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      getPostsPage({
        cursor: pageParam,
        limit: pageSize,
        tier: selectedTier,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore || !lastPage.nextCursor) {
        return undefined;
      }

      return lastPage.nextCursor;
    },
  });

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data],
  );

  const onRefresh = async () => {
    feedUiStore.setRefreshing(true);
    try {
      await refetch();
    } finally {
      feedUiStore.setRefreshing(false);
    }
  };

  const onEndReached = () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    fetchNextPage();
  };

  const renderHeader = (
    <>
      <FilterTabs selectedFilter={selectedFilter} />
    </>
  );

  if (isPending && posts.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader}
        <View style={styles.listContent}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyScreen}>
        <EmptyState
          onGoHome={() => {
            feedUiStore.setFilter("all");
            refetch();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            isExpanded={Boolean(expandedPosts[item.id])}
            onExpand={(postId) => {
              setExpandedPosts((prev) => ({ ...prev, [postId]: true }));
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feedUiStore.isRefreshing}
            onRefresh={onRefresh}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.paginationLoaderWrap}>
              <ActivityIndicator size="small" color={tokens.colors.accent} />
            </View>
          ) : null
        }
      />
    </View>
  );
});

export default FeedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  emptyScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.xl,
    backgroundColor: tokens.colors.background,
  },
  filtersWrap: {
    flexDirection: "row",
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.accentBorder,
    borderRadius: tokens.radii.full,
    paddingHorizontal: tokens.spacing.xs,
    marginHorizontal: tokens.spacing.xl,
    marginTop: tokens.spacing.xxl,
    marginBottom: tokens.spacing.lg,
    overflow: "hidden",
  },
  filterButton: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  filterButtonActive: {
    backgroundColor: tokens.colors.accent,
  },
  filterButtonText: {
    textAlign: "center",
    color: tokens.colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: tokens.colors.textOnPrimary,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: 0,
    paddingVertical: tokens.spacing.lg,
    gap: tokens.spacing.xl,
  },
  cardContent: {
    paddingHorizontal: tokens.spacing.xl,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.avatarFallback,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
  },
  coverImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 0,
    backgroundColor: tokens.colors.avatarFallback,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
    lineHeight: 26,
  },
  previewText: {
    fontSize: 15,
    lineHeight: 20,
    color: tokens.colors.textMuted,
  },
  expandButtonWrap: {
    alignSelf: "flex-start",
    marginTop: tokens.spacing.sm,
  },
  expandButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: tokens.colors.accent,
  },
  paidMediaWrap: {
    position: "relative",
    gap: tokens.spacing.sm,
  },
  paidImageWrap: {
    position: "relative",
  },
  paidMediaSkeleton: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 0,
  },
  paidTextSkeletonWrap: {
    paddingHorizontal: tokens.spacing.xl,
    gap: tokens.spacing.sm,
    marginTop: 0,
    marginBottom: 0,
  },
  lockedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: tokens.colors.lockBackground,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.xl,
  },
  lockedBlock: {
    flexDirection: "column",
    gap: tokens.spacing.sm,
    borderRadius: tokens.radii.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  lockedText: {
    textAlign: "center",
    color: tokens.colors.textOnPrimary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
    paddingTop: tokens.spacing.sm,
  },
  countChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.accentMuted,
  },
  countChipText: {
    fontSize: 13,
    color: tokens.colors.chipText,
    fontWeight: "700",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.xl,
    width: "100%",
    maxWidth: 360,
  },
  illustration: {
    width: 112,
    height: 112,
    alignSelf: "center",
  },
  stateMessage: {
    fontSize: 18,
    color: tokens.colors.textPrimary,
    textAlign: "center",
    fontWeight: "700",
    lineHeight: 26,
  },
  primaryButton: {
    backgroundColor: tokens.colors.accent,
    borderRadius: tokens.radii.xl,
    alignSelf: "stretch",
    minHeight: 42,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  primaryButtonPressed: {
    backgroundColor: tokens.colors.accentPressed,
  },
  primaryButtonText: {
    color: tokens.colors.textOnPrimary,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 20,
  },
  paginationLoaderWrap: {
    paddingVertical: tokens.spacing.xl,
    alignItems: "center",
  },
  skeleton: {
    backgroundColor: tokens.colors.skeleton,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.full,
  },
  skeletonAuthor: {
    width: 120,
    height: 20,
    borderRadius: 22,
  },
  skeletonMedia: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 0,
  },
  skeletonTitle: {
    width: 164,
    height: 26,
    borderRadius: 22,
  },
  skeletonPreview: {
    width: "100%",
    height: 20,
    borderRadius: 22,
  },
  skeletonChip: {
    width: 64,
    height: 36,
    borderRadius: 22,
  },
});

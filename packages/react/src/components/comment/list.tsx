import { forwardRef, type HTMLAttributes, useState } from "react";
import useSWRImmutable from "swr/immutable";
import { fetchComments, getCommentsKey } from "../../utils/fetcher";
import { cn } from "../../utils/cn";
import { buttonVariants } from "../button";
import { Spinner } from "../spinner";
import { syncComments } from "../../utils/comment-manager";
import { updateCommentList, useCommentList } from "../../utils/comment-list";
import { useCommentsContext } from "../../contexts/comments";
import { Comment } from "./index";

const count = 40;

export interface CommentListProps extends HTMLAttributes<HTMLDivElement> {
  threadId?: number;
}

export const CommentList = forwardRef<HTMLDivElement, CommentListProps>(
  ({ threadId, ...props }, ref) => {
    const { page } = useCommentsContext();
    const [cursor, setCursor] = useState<number>();
    const list = useCommentList([page, threadId]);

    const query = useSWRImmutable(
      getCommentsKey({
        thread: threadId,
        page,
        before: typeof cursor === "number" ? new Date(cursor) : undefined,
        limit: count,
      }),
      ([_, options]) => fetchComments(options),
      {
        onSuccess(data) {
          updateCommentList([page, threadId], (v) => [...v, ...data]);
          syncComments(data);
        },
      },
    );

    return (
      <div
        ref={ref}
        {...props}
        className={cn("flex flex-col pb-2", props.className)}
      >
        {!query.isLoading &&
          typeof cursor === "undefined" &&
          list.length === 0 && (
            <p className="m-auto text-center text-sm text-fc-muted-foreground">
              No comments
            </p>
          )}
        {list.map((reply) => (
          <Comment comment={reply} key={reply.id} />
        ))}
        {query.data && query.data.length >= count ? (
          <button
            type="button"
            className={cn(
              buttonVariants({
                variant: "secondary",
                size: "medium",
                className: "mx-auto my-2",
              }),
            )}
            onClick={() => {
              if (list.length > 0)
                setCursor(new Date(list[list.length - 1].timestamp).getTime());
            }}
          >
            Load More
          </button>
        ) : null}
        {query.isLoading ? <Spinner className="mx-auto my-4 size-8" /> : null}
      </div>
    );
  },
);

CommentList.displayName = "CommentsList";

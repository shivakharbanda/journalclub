import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { fetcher } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageCircle, Reply, Send, Loader2, LogIn } from "lucide-react"
import { toast } from "sonner"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

type Comment = {
  id: number
  content: string
  created_at: string
  user: {
    id: number
    username: string
    email?: string
    avatar?: string
  }
  replies_count: number
  replies?: Comment[]
  showReplies?: boolean
}

type CommentsProps = {
  objectType: string
  objectId: number
  className?: string
}

type CommentItemProps = {
  comment: Comment
  isReply?: boolean
  onReply: (parentId: number) => void
  onToggleReplies: (commentId: number) => void
  replyingTo: number | null
  onSetReplyingTo: (id: number | null) => void
  replyContent: string
  onSetReplyContent: (content: string) => void
  submitting: boolean
  loadingReplies: number[]
  isAuthenticated: boolean
}

type CommentFormProps = {
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel?: () => void
  submitting: boolean
  showCancel?: boolean
}

// Reusable Comment Form Component
function CommentForm({ 
  placeholder, 
  value, 
  onChange, 
  onSubmit, 
  onCancel, 
  submitting, 
  showCancel = false 
}: CommentFormProps) {
  return (
    <div className="space-y-3">
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`resize-none ${showCancel ? 'min-h-[80px]' : 'min-h-[100px]'}`}
        disabled={submitting}
      />
      <div className="flex gap-2 justify-end">
        {showCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!value.trim() || submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Send className="h-4 w-4 mr-1" />
          )}
          {showCancel ? 'Reply' : 'Post Comment'}
        </Button>
      </div>
    </div>
  )
}

// Individual Comment Item Component
function CommentItem({
  comment,
  isReply = false,
  onReply,
  onToggleReplies,
  replyingTo,
  onSetReplyingTo,
  replyContent,
  onSetReplyContent,
  submitting,
  loadingReplies,
  isAuthenticated
}: CommentItemProps) {
  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleToggleReply = () => {
    if (replyingTo === comment.id) {
      // Closing reply form
      onSetReplyingTo(null)
      onSetReplyContent("")
    } else {
      // Opening reply form - pre-populate with @username if it's a reply to a reply
      onSetReplyingTo(comment.id)
      const mentionText = isReply ? `@${comment.user.username} ` : ""
      onSetReplyContent(mentionText)
    }
  }

  const handleSubmitReply = () => {
    onReply(comment.id)
  }

  const handleCancelReply = () => {
    onSetReplyingTo(null)
    onSetReplyContent("")
  }

  return (
    <div className="flex gap-4">
      <Avatar className={`flex-shrink-0 ${isReply ? 'h-8 w-8' : 'h-10 w-10'}`}>
        <AvatarImage src={comment.user.avatar} />
        <AvatarFallback className={isReply ? 'text-xs' : ''}>
          {getUserInitials(comment.user.username)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isReply ? 'text-sm' : 'text-base'}`}>
            {comment.user.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
        
        <p className={`text-muted-foreground leading-relaxed ${isReply ? 'text-sm' : ''}`}>
          {comment.content}
        </p>
        
        <div className="flex items-center gap-4 pt-2">
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs px-2 ${isReply ? 'h-6' : 'h-8'}`}
              onClick={handleToggleReply}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs px-2 ${isReply ? 'h-6' : 'h-8'}`}
              onClick={() => toast.error('Please log in to reply')}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
          
          {!isReply && comment.replies_count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-2"
              onClick={() => onToggleReplies(comment.id)}
              disabled={loadingReplies.includes(comment.id)}
            >
              {loadingReplies.includes(comment.id) ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <MessageCircle className="h-3 w-3 mr-1" />
              )}
              {comment.showReplies ? 'Hide' : 'Show'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
            </Button>
          )}
        </div>

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className="mt-4">
            <CommentForm
              placeholder={`Reply to ${comment.user.username}...`}
              value={replyContent}
              onChange={onSetReplyContent}
              onSubmit={handleSubmitReply}
              onCancel={handleCancelReply}
              submitting={submitting}
              showCancel={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Main Comments Component
export default function Comments({ objectType, objectId, className = "" }: CommentsProps) {
  const { isAuthenticated } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [loadingReplies, setLoadingReplies] = useState<number[]>([])

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetcher<{
        results: Comment[]
        count: number
      }>(`/comments/?object_type=${objectType}&object_id=${objectId}`)
      setComments(response.results || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [objectType, objectId])

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return

    try {
      setSubmitting(true)
      const commentData = {
        content: newComment,
        object_type: objectType,
        object_id: objectId
      }

      const newCommentResponse = await fetcher<Comment>('/comments/', {
        method: 'POST',
        body: JSON.stringify(commentData)
      })

      setComments(prev => [newCommentResponse, ...prev])
      setNewComment("")
      toast.success('Comment posted successfully!')
    } catch (error) {
      console.error('Failed to post comment:', error)
      toast.error('Failed to post comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Submit reply - handles both top-level and nested replies
  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim() || !isAuthenticated) return

    try {
      setSubmitting(true)
      const replyData = {
        content: replyContent,
        object_type: objectType,
        object_id: objectId,
        parent: parentId
      }

      const newReply = await fetcher<Comment>('/comments/', {
        method: 'POST',
        body: JSON.stringify(replyData)
      })

      // Find the top-level parent comment to update (flat structure)
      const findTopLevelParent = (commentId: number): number => {
        for (const comment of comments) {
          if (comment.id === commentId) return commentId
          if (comment.replies?.some(reply => reply.id === commentId)) {
            return comment.id // Return the top-level comment, not the nested reply
          }
        }
        return commentId
      }

      const topLevelParentId = findTopLevelParent(parentId)

      // Update the top-level parent comment's replies (flat structure)
      setComments(prev => prev.map(comment => {
        if (comment.id === topLevelParentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
            replies_count: comment.replies_count + 1
          }
        }
        return comment
      }))

      setReplyContent("")
      setReplyingTo(null)
      toast.success('Reply posted successfully!')
    } catch (error) {
      console.error('Failed to post reply:', error)
      toast.error('Failed to post reply. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Load replies for a comment
  const loadReplies = async (commentId: number) => {
    try {
      setLoadingReplies(prev => [...prev, commentId])
      const replies = await fetcher<Comment[]>(`/comments/${commentId}/replies/`)
      
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: replies,
            showReplies: true
          }
        }
        return comment
      }))
    } catch (error) {
      console.error('Failed to load replies:', error)
      toast.error('Failed to load replies')
    } finally {
      setLoadingReplies(prev => prev.filter(id => id !== commentId))
    }
  }

  // Toggle replies visibility
  const toggleReplies = (commentId: number) => {
    const comment = comments.find(c => c.id === commentId)
    if (comment?.replies) {
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, showReplies: !c.showReplies } : c
      ))
    } else {
      loadReplies(commentId)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [objectType, objectId, fetchComments])

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading comments...</span>
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="h-5 w-5" />
          <h2 className="text-xl font-semibold">
            Comments ({comments.length})
          </h2>
        </div>

        {/* New Comment Form */}
        {isAuthenticated ? (
          <div className="mb-8">
            <CommentForm
              placeholder="Add your comment..."
              value={newComment}
              onChange={setNewComment}
              onSubmit={handleSubmitComment}
              submitting={submitting}
            />
          </div>
        ) : (
          <Alert className="mb-8">
            <LogIn className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Please log in to join the conversation</span>
              <Button asChild variant="outline" size="sm">
                <Link to="/login">Log In</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-4">
                <CommentItem
                  comment={comment}
                  onReply={handleSubmitReply}
                  onToggleReplies={toggleReplies}
                  replyingTo={replyingTo}
                  onSetReplyingTo={setReplyingTo}
                  replyContent={replyContent}
                  onSetReplyContent={setReplyContent}
                  submitting={submitting}
                  loadingReplies={loadingReplies}
                  isAuthenticated={isAuthenticated}
                />

                {/* Replies */}
                {comment.showReplies && comment.replies && comment.replies.length > 0 && (
                  <div className="ml-14 space-y-4 border-l-2 border-muted pl-6">
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        isReply={true}
                        onReply={handleSubmitReply}
                        onToggleReplies={toggleReplies}
                        replyingTo={replyingTo}
                        onSetReplyingTo={setReplyingTo}
                        replyContent={replyContent}
                        onSetReplyContent={setReplyContent}
                        submitting={submitting}
                        loadingReplies={loadingReplies}
                        isAuthenticated={isAuthenticated}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
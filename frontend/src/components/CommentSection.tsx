import { useState, useEffect } from "react"
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
  objectType: string // e.g., 'episode'
  objectId: number
  className?: string
}

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
  const fetchComments = async () => {
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
  }

  // Submit new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    if (!isAuthenticated) {
      toast.error('Please log in to post a comment')
      return
    }

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
      if (error instanceof Error && error.message.includes('Authentication credentials were not provided')) {
        toast.error('Please log in to post a comment')
      } else {
        toast.error('Failed to post comment. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Submit reply
  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim()) return

    if (!isAuthenticated) {
      toast.error('Please log in to post a reply')
      return
    }

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

      // Update the parent comment's replies
      setComments(prev => prev.map(comment => {
        if (comment.id === parentId) {
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
      if (error instanceof Error && error.message.includes('Authentication credentials were not provided')) {
        toast.error('Please log in to post a reply')
      } else {
        toast.error('Failed to post reply. Please try again.')
      }
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
      // If replies are already loaded, just toggle visibility
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, showReplies: !c.showReplies } : c
      ))
    } else {
      // Load replies if not loaded yet
      loadReplies(commentId)
    }
  }

  // Get user initials for avatar fallback
  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  useEffect(() => {
    fetchComments()
  }, [objectType, objectId])

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
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="h-5 w-5" />
          <h2 className="text-xl font-semibold">
            Comments ({comments.length})
          </h2>
        </div>

        {/* New Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="mb-8 space-y-4">
            <Textarea
              placeholder="Add your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newComment.trim() || submitting}
                className="flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post Comment
              </Button>
            </div>
          </form>
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
                {/* Main Comment */}
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={comment.user.avatar} />
                    <AvatarFallback>
                      {getUserInitials(comment.user.username)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {comment.user.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {comment.content}
                    </p>
                    
                    <div className="flex items-center gap-4 pt-2">
                      {isAuthenticated ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 px-2"
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 px-2"
                          onClick={() => toast.error('Please log in to reply')}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      )}
                      
                      {comment.replies_count > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 px-2"
                          onClick={() => toggleReplies(comment.id)}
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
                      <div className="mt-4 space-y-3">
                        <Textarea
                          placeholder={`Reply to ${comment.user.username}...`}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="min-h-[80px] resize-none"
                          disabled={submitting}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyContent("")
                            }}
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyContent.trim() || submitting}
                          >
                            {submitting ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Send className="h-4 w-4 mr-1" />
                            )}
                            Reply
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {comment.showReplies && comment.replies && comment.replies.length > 0 && (
                  <div className="ml-14 space-y-4 border-l-2 border-muted pl-6">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-4">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={reply.user.avatar} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(reply.user.username)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {reply.user.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(reply.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {reply.content}
                          </p>
                        </div>
                      </div>
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
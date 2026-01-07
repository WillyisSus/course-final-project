import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Reply, X, CornerDownRight, ShieldCheck, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ProductComment } from '@/types/product';
import { ScrollArea } from '@/components/ui/scroll-area'; 

interface CommentSectionProps {
  comments: ProductComment[];
  onPostComment: (content: string, parentId?: number | null) => void;
  isOwner?: boolean;
}

const CommentSection = ({ comments, onPostComment, isOwner = false }: CommentSectionProps) => {
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ProductComment | null>(null);
  
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  const createCommentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
  });

  type CreateCommentInput = z.infer<typeof createCommentSchema>;

  const {
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    setFocus
  } = useForm<CreateCommentInput>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { content: "" },
  });

  const onSubmit = (data: CreateCommentInput) => {
    if (!text.trim()) return;
    onPostComment(text, replyingTo?.comment_id || null);
    setText("");
    setReplyingTo(null);
    reset();
  };

  const handleCancel = () => {
    setText("");
    setReplyingTo(null);
    reset();
  };

  const handleReplyClick = (comment: ProductComment) => {
    setReplyingTo(comment);
    setFocus("content");
    document.getElementById("comment-form")?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleReplies = (commentId: number) => {
    setExpandedComments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(commentId)) {
            newSet.delete(commentId);
        } else {
            newSet.add(commentId);
        }
        return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Discussion ({comments.length})</h3>
      
      <div className="space-y-6">
        {comments.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
             <p className="italic">No questions yet. Be the first to ask!</p>
           </div>
        ) : (
           comments.map((comment) => {
             const hasReplies = comment.replies && comment.replies.length > 0;
             const isExpanded = expandedComments.has(comment.comment_id);

             return (
             <div key={comment.comment_id} className="flex flex-col gap-3">
                
                {/* ROOT COMMENT */}
                <div className="flex gap-4 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                   <Avatar>
                     <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                       {comment.user.full_name?.charAt(0).toUpperCase() || "U"}
                     </AvatarFallback>
                   </Avatar>
                   <div className="space-y-1 w-full">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{comment.user.full_name}</span>
                          <span className="text-xs text-gray-400">• {new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                     </div>
                     <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                     
                     <div className="flex items-center gap-4 mt-2">
                         {isOwner && (
                            <button 
                                onClick={() => handleReplyClick(comment)}
                                className="text-xs font-semibold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                            >
                                <Reply className="w-3 h-3" /> Reply
                            </button>
                         )}

                         {hasReplies && (
                            <button 
                                onClick={() => toggleReplies(comment.comment_id)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="w-3 h-3" /> Hide {comment.replies?.length} replies
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3" /> View {comment.replies?.length} replies
                                    </>
                                )}
                            </button>
                         )}
                     </div>
                   </div>
                </div>
                {hasReplies && isExpanded && (
                    <div className="pl-8 sm:pl-12 animate-in slide-in-from-top-2 fade-in duration-200">
                        <ScrollArea className="max-h-[680px] overflow-y-auto pr-2 space-y-3 border-l-2 border-gray-100 pl-4 py-2">
                            {comment.replies?.map(reply => (
                                <div key={reply.comment_id} className="flex gap-3 relative">
                                    <div className="flex-1 flex gap-3 p-3 bg-amber-50/60 border border-amber-100 rounded-lg">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-amber-100 text-amber-700">
                                            <ShieldCheck className="w-4 h-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-gray-900">{reply.user.full_name}</span>
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                                                Seller
                                            </Badge>
                                            <span className="text-xs text-gray-400">• {new Date(reply.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-gray-800 text-sm whitespace-pre-wrap">{reply.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                )}
             </div>
             );
           })
        )}
      </div>

      <Separator />

      <div id="comment-form" className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
        {replyingTo && (
            <div className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm border border-blue-100 animate-in fade-in slide-in-from-bottom-1">
                <span className="flex items-center gap-2 flex-1 min-w-0">
                    <CornerDownRight className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                        Replying to <span className="font-bold">{replyingTo.user.full_name}: {replyingTo.content}</span>
                    </span>
                </span>
                <button onClick={() => setReplyingTo(null)} className="hover:bg-blue-100 p-1 rounded flex-shrink-0">
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}

        <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
                {replyingTo ? "Write your reply" : "Ask a question"}
            </h4>
            <Textarea 
              {...register("content", { required: true })}
              placeholder={replyingTo ? "Type your reply here..." : "Ask a question about this product..."} 
              className="min-h-[100px] bg-white focus-visible:ring-blue-500"
              value={text}
              onChange={(e) => {
                  setText(e.target.value);
                  register("content").onChange(e); 
              }}
            />
            <p className='text-red-500 text-sm min-h-5'>
              {errors.content && errors.content.message}
            </p>
        </div>
        
        <div className='flex flex-row gap-3 self-end'>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={!text.trim()} className={replyingTo ? "bg-amber-600 hover:bg-amber-700" : ""}>
            {replyingTo ? "Post Reply" : "Post Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
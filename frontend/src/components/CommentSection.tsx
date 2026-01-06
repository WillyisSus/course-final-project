import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { ProductComment } from '@/types/product';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
interface CommentSectionProps {
  comments: ProductComment[];
  onPostComment: (content: string) => void;
}

const CommentSection = ({ comments, onPostComment }: CommentSectionProps) => {
  const [text, setText] = useState("");
  const createCommentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
  });
  type CreateCommentInput = z.infer<typeof createCommentSchema>;
  const {
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset} = useForm<CreateCommentInput>(
  {
    resolver: zodResolver(createCommentSchema),
    defaultValues: { content: "" },
  }) 
  const onSubmit = () => {
    if (!text.trim()) return;
    onPostComment(text);
    setText("");
  };
  const handleCancel = () => {
    setText("");
    reset();
  }
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Discussion</h3>
      
      {/* List Comments */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.comment_id} className="flex gap-4 p-4 border rounded-lg bg-white shadow-sm">
             <Avatar>
               <AvatarFallback className="bg-blue-100 text-blue-700">
                 {comment.user.full_name.charAt(0)}
               </AvatarFallback>
             </Avatar>
             <div className="space-y-1">
               <div className="flex items-center gap-2">
                 <span className="font-semibold text-sm">{comment.user.full_name}</span>
                 <span className="text-xs text-gray-400">• {new Date(comment.created_at).toLocaleString()}</span>
               </div>
               <p className="text-gray-700 text-sm">{comment.content}</p>
             </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Post Comment Form */}
      <div className="flex flex-col gap-4">
        <Textarea 
          {...register("content", { required: true })}
          placeholder="Ask a question or share your thoughts..." 
          className="min-h-[100px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className='text-red text-sm'>
          {errors.content && errors.content.message}
        </p>
        <div className='flex flex-row gap-4 self-end'>
          <Button onClick={handleSubmit(onSubmit)} className="self-end" disabled={!text.trim()}>
            Post
          </Button>
          <Button onClick={handleCancel} className="self-end">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
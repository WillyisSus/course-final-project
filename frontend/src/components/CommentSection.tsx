import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface Comment {
  comment_id: number;
  content: string;
  created_at: string;
  user: { full_name: string };
}

interface CommentSectionProps {
  comments: Comment[];
  onPostComment: (content: string) => void;
}

const CommentSection = ({ comments, onPostComment }: CommentSectionProps) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onPostComment(text);
    setText("");
  };

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
      <div className="flex gap-4">
        <Textarea 
          placeholder="Ask a question or share your thoughts..." 
          className="min-h-[100px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button onClick={handleSubmit} className="self-end" disabled={!text.trim()}>
          Post
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
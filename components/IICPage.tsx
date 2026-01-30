import React, { useState, useEffect } from 'react';
import { IICPost, User } from '../types';
import { Image as ImageIcon, Video, Type, Send, Trash2, Calendar, User as UserIcon, Upload, Link } from 'lucide-react';
import { CustomAlert, CustomConfirm } from './CustomDialogs';

interface Props {
  user: User;
  onBack: () => void;
}

export const IICPage: React.FC<Props> = ({ user, onBack }) => {
  const [posts, setPosts] = useState<IICPost[]>([]);
  const isAdmin = user.role === 'ADMIN';

  // Admin Post Form State
  const [postType, setPostType] = useState<'TEXT' | 'IMAGE' | 'VIDEO'>('TEXT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // Text or URL
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({
      isOpen: false, message: '', onConfirm: () => {}
  });

  useEffect(() => {
    const storedPosts = localStorage.getItem('nst_iic_posts');
    if (storedPosts) {
      setPosts(JSON.parse(storedPosts));
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 500000) { // Limit to 500KB for LocalStorage safety
              setAlertConfig({isOpen: true, message: "Image too large! Please choose an image under 500KB."});
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setImageBase64(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handlePost = () => {
      if (!title) { setAlertConfig({isOpen: true, message: "Please enter a title"}); return; }
      
      let finalContent = content;
      if (postType === 'IMAGE') {
          if (!imageBase64) { setAlertConfig({isOpen: true, message: "Please upload an image"}); return; }
          finalContent = imageBase64;
      }
      if (postType === 'VIDEO' && !content) {
          setAlertConfig({isOpen: true, message: "Please enter a video URL (YouTube embed or MP4)"}); return; 
      }
      if (postType === 'TEXT' && !content) {
          setAlertConfig({isOpen: true, message: "Please enter some text"}); return;
      }

      const newPost: IICPost = {
          id: Date.now().toString(),
          type: postType,
          title: title,
          content: finalContent,
          timestamp: new Date().toISOString(),
          authorName: user.name
      };

      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      localStorage.setItem('nst_iic_posts', JSON.stringify(updatedPosts));
      
      // Reset Form
      setTitle('');
      setContent('');
      setImageBase64(null);
      setPostType('TEXT');
  };

  const handleDelete = (id: string) => {
      setConfirmConfig({
          isOpen: true,
          message: "Delete this post?",
          onConfirm: () => {
              const updated = posts.filter(p => p.id !== id);
              setPosts(updated);
              localStorage.setItem('nst_iic_posts', JSON.stringify(updated));
          }
      });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-10">
      <CustomAlert 
            isOpen={alertConfig.isOpen} 
            message={alertConfig.message} 
            onClose={() => setAlertConfig({...alertConfig, isOpen: false})} 
      />
      <CustomConfirm
            isOpen={confirmConfig.isOpen}
            message={confirmConfig.message}
            onConfirm={() => {
                confirmConfig.onConfirm();
                setConfirmConfig({...confirmConfig, isOpen: false});
            }}
            onCancel={() => setConfirmConfig({...confirmConfig, isOpen: false})}
      />
      
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 transition-colors mr-4 font-bold flex items-center gap-1">
           &larr; Back
        </button>
        <div>
            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                <span className="text-blue-600">IIC</span> Gallery
            </h2>
            <p className="text-sm text-slate-500 font-medium">Important Information Center</p>
        </div>
      </div>

      {/* Admin Creator Panel */}
      {isAdmin && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 mb-10">
              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <Upload size={20} className="text-blue-600" /> Create New Post
              </h3>
              
              <div className="flex gap-2 mb-4 bg-slate-50 p-1 rounded-lg w-fit">
                  <button onClick={() => setPostType('TEXT')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${postType === 'TEXT' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>
                      <Type size={16} /> Message
                  </button>
                  <button onClick={() => setPostType('IMAGE')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${postType === 'IMAGE' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>
                      <ImageIcon size={16} /> Photo
                  </button>
                  <button onClick={() => setPostType('VIDEO')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${postType === 'VIDEO' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>
                      <Video size={16} /> Video
                  </button>
              </div>

              <div className="space-y-4">
                  <input 
                      type="text" 
                      placeholder="Post Title / Headline"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                  
                  {postType === 'TEXT' && (
                      <textarea 
                          placeholder="Write your detailed message here..."
                          value={content}
                          onChange={e => setContent(e.target.value)}
                          className="w-full h-32 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      />
                  )}

                  {postType === 'IMAGE' && (
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                          <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {imageBase64 ? (
                              <div className="relative inline-block">
                                  <img src={imageBase64} alt="Preview" className="h-40 rounded-lg shadow-sm" />
                                  <div className="mt-2 text-xs text-green-600 font-bold">Image Selected</div>
                              </div>
                          ) : (
                              <div className="text-slate-400">
                                  <ImageIcon size={32} className="mx-auto mb-2" />
                                  <p className="font-bold text-sm">Click to Upload Image</p>
                                  <p className="text-xs">Max size: 500KB</p>
                              </div>
                          )}
                      </div>
                  )}

                  {postType === 'VIDEO' && (
                      <div>
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                             <Link size={16} className="text-slate-400" />
                             <input 
                                type="url" 
                                placeholder="Paste Video URL (YouTube, Vimeo, etc.)"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="w-full bg-transparent outline-none text-sm"
                             />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 ml-1">Note: Paste a valid Embed URL or MP4 link.</p>
                      </div>
                  )}

                  <button 
                      onClick={handlePost}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                      <Send size={18} /> Publish Post
                  </button>
              </div>
          </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-8">
          {posts.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                  <p>No posts yet in the IIC Gallery.</p>
              </div>
          )}

          {posts.map(post => (
              <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">
                              {post.authorName.charAt(0)}
                          </div>
                          <div>
                              <p className="font-bold text-slate-800 text-sm">{post.authorName} <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded ml-1">ADMIN</span></p>
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                  <Calendar size={10} /> {new Date(post.timestamp).toLocaleDateString()}
                              </p>
                          </div>
                      </div>
                      {isAdmin && (
                          <button onClick={() => handleDelete(post.id)} className="text-slate-300 hover:text-red-500">
                              <Trash2 size={18} />
                          </button>
                      )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                      <h3 className="text-xl font-black text-slate-900 mb-4">{post.title}</h3>
                      
                      {post.type === 'TEXT' && (
                          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      )}

                      {post.type === 'IMAGE' && (
                          <div className="rounded-xl overflow-hidden border border-slate-100">
                              <img src={post.content} alt={post.title} className="w-full h-auto object-cover" />
                          </div>
                      )}

                      {post.type === 'VIDEO' && (
                          <div className="aspect-video rounded-xl overflow-hidden bg-black">
                              <iframe 
                                  src={post.content.replace("watch?v=", "embed/")} 
                                  title={post.title} 
                                  className="w-full h-full border-0" 
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                  allowFullScreen
                              ></iframe>
                          </div>
                      )}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

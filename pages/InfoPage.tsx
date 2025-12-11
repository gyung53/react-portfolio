import React from 'react';

const InfoPage: React.FC = () => {
  return (
    <section className="w-full min-h-screen bg-white relative flex items-center justify-center p-20 animate-fadeInDown">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* About Me Card */}
            <div className="bg-white/80 backdrop-blur-md rounded-[20px] shadow-xl p-8 border border-gray-100 hover:transform hover:-translate-y-2 transition-all duration-300">
                <h2 className="text-2xl font-bold text-primary mb-6">About Me</h2>
                <p className="text-gray-600 leading-relaxed">
                    사용자의 경험을 디자인하고<br />
                    개발로 구현하는<br />
                    <span className="font-bold text-black">UX/UI 디자이너 & 퍼블리셔</span><br />
                    김가경입니다.
                </p>
            </div>

            {/* Contact Card */}
            <div className="bg-white/80 backdrop-blur-md rounded-[20px] shadow-xl p-8 border border-gray-100 hover:transform hover:-translate-y-2 transition-all duration-300 delay-100">
                <h2 className="text-2xl font-bold text-primary mb-6">Contact</h2>
                <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-3">
                        <span className="font-semibold text-black min-w-[80px]">Email</span> 
                        your@email.com
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="font-semibold text-black min-w-[80px]">Instagram</span> 
                        @yourhandle
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="font-semibold text-black min-w-[80px]">Behance</span> 
                        yourprofile
                    </li>
                </ul>
            </div>

            {/* Skills Card */}
            <div className="bg-white/80 backdrop-blur-md rounded-[20px] shadow-xl p-8 border border-gray-100 hover:transform hover:-translate-y-2 transition-all duration-300 delay-200">
                <h2 className="text-2xl font-bold text-primary mb-6">Skills</h2>
                <ul className="space-y-3">
                    <li className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium">UI/UX Design</li>
                    <li className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium">HTML/CSS/JS</li>
                    <li className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium">3D Modeling (Blender)</li>
                </ul>
            </div>
        </div>
    </section>
  );
};

export default InfoPage;
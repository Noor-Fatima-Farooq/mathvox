import React from 'react';
import { Link } from 'react-router-dom';
import { t } from '../translations';

const Home = () => {
  const features = [
    { icon: "fa-microphone", title: t.feat_voice, desc: t.feat_voice_desc },
    { icon: "fa-camera", title: t.feat_scan, desc: t.feat_scan_desc },
    { icon: "fa-trophy", title: t.feat_game, desc: t.feat_game_desc },
    { icon: "fa-book-open", title: t.feat_steps, desc: t.feat_steps_desc },
  ];

  return (
    <section className="flex flex-col items-center py-12 px-6 text-center">

      {/* Logo */}
      <div
        className="
          w-20 h-20 bg-[#5d44f8] rounded-2xl
          flex items-center justify-center mb-6
          shadow-lg shadow-indigo-200 dark:shadow-none
          animate-[fadeIn_0.7s_ease-out]
          transition-transform duration-300
          hover:scale-110 hover:rotate-2
        "
      >
        <i className="fa-solid fa-graduation-cap text-white text-4xl"></i>
      </div>

      {/* Welcome */}
      <p
        className="
          text-gray-500 dark:text-gray-400 text-sm mb-2
          animate-[fadeUp_0.7s_ease-out_0.15s_both]
        "
      >
        {t.welcome}
      </p>

      {/* Main Heading */}
      <h1
        className="
          text-6xl font-bold mb-4
          text-gray-900 dark:text-white
          tracking-tight
          animate-[fadeUp_0.7s_ease-out_0.25s_both]
        "
      >
        Math<span className="text-[#5d44f8]">Vox</span>
      </h1>

      {/* Subtitle */}
      <p
        className="
          text-gray-600 dark:text-gray-300
          text-lg font-medium mb-6
          animate-[fadeUp_0.7s_ease-out_0.4s_both]
        "
      >
        {t.hero_sub}
      </p>

      {/* Description */}
      <p
        className="
          max-w-3xl
          text-gray-500 dark:text-gray-400
          leading-relaxed mb-12
          animate-[fadeUp_0.7s_ease-out_0.55s_both]
        "
      >
        {t.hero_desc}
      </p>

      {/* Why Choose */}
      <h3
        className="
          text-gray-800 dark:text-gray-200
          font-bold text-xl mb-10
          animate-[fadeUp_0.7s_ease-out_0.7s_both]
        "
      >
        {t.why_choose}
      </h3>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-16">

        {features.map((item, index) => (
          <div
            key={index}
            style={{ animationDelay: `${0.8 + index * 0.15}s` }}
            className="
              bg-white dark:bg-slate-800
              p-8 rounded-2xl
              shadow-sm
              border border-gray-100 dark:border-slate-700

              animate-[fadeUp_0.7s_ease-out_both]

              hover:shadow-xl
              hover:-translate-y-2
              transition-all duration-300
            "
          >

            {/* Icon */}
            <div
              className="
                w-10 h-10
                bg-indigo-50 dark:bg-slate-700
                text-[#5d44f8] dark:text-indigo-400
                rounded-lg
                flex items-center justify-center
                mb-4 text-xl

                transition-transform duration-300
                hover:scale-110
              "
            >
              <i className={`fa-solid ${item.icon}`}></i>
            </div>

            <h4 className="font-bold mb-2 text-gray-900 dark:text-white">
              {item.title}
            </h4>

            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {item.desc}
            </p>
          </div>
        ))}

      </div>

      {/* Get Started */}
      <div
        className="
          flex flex-col items-center mt-4
          animate-[fadeUp_0.7s_ease-out_1.5s_both]
        "
      >
        <Link to="/chat">
          <button
            className="
              bg-black dark:bg-white
              text-white dark:text-black
              px-10 py-3
              rounded-xl
              font-bold
              flex items-center gap-2

              hover:scale-105
              hover:shadow-2xl
              active:scale-95

              transition-all duration-300
              shadow-xl
            "
          >
            <i className="fa-solid fa-graduation-cap"></i>
            Get Started
          </button>
        </Link>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

    </section>
  );
};

export default Home;
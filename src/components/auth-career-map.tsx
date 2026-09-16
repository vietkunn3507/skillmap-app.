/** Code-native illustration: a continuous route from existing skills to a goal. */
export function AuthCareerMap() {
  return (
    <figure className="auth-route-map">
      <svg viewBox="0 0 600 410" role="img" aria-labelledby="auth-map-title auth-map-desc">
        <title id="auth-map-title">Bản đồ hành trình đến nghề mơ ước</title>
        <desc id="auth-map-desc">Các nhân vật tiến lên theo một con đường có các mốc, bậc thang và lá cờ tại đích.</desc>
        <defs>
          <linearGradient id="auth-land" x2="1" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#eef6ff"/></linearGradient>
          <linearGradient id="auth-route" x1="530" y1="350" x2="175" y2="106" gradientUnits="userSpaceOnUse"><stop stopColor="#8f79c7"/><stop offset=".5" stopColor="#7141be"/><stop offset="1" stopColor="#3b1972"/></linearGradient>
          <linearGradient id="auth-finish"><stop stopColor="#22c9ce"/><stop offset="1" stopColor="#079ab7"/></linearGradient>
          <radialGradient id="auth-aura"><stop stopColor="#af91f4" stopOpacity=".24"/><stop offset="1" stopColor="#af91f4" stopOpacity="0"/></radialGradient>
          <radialGradient id="auth-node-shine" cx=".3" cy=".2"><stop stopColor="white" stopOpacity=".55"/><stop offset="1" stopColor="white" stopOpacity="0"/></radialGradient>
        </defs>
        <ellipse cx="310" cy="230" rx="290" ry="180" fill="url(#auth-aura)" className="route-aura"/>
        <path d="M26 185C35 93 144 52 293 60C417 66 553 76 579 194C602 306 517 386 381 386C229 386 14 321 26 185Z" fill="url(#auth-land)"/>
        <g className="route-dust" fill="#d1bde9"><circle cx="60" cy="119" r="3"/><circle cx="555" cy="320" r="3"/><circle cx="301" cy="398" r="2"/><path d="M534 79v12m-6-6h12M48 358v10m-5-5h10" stroke="#c7a8e7" strokeWidth="2"/></g>
        {/* One unbroken route, with steps showing progress toward the goal. */}
        <path d="M530 350H130V332H110V314H90V296H70V288Q70 240 123 240H418V220H438V200H458V180H478V159Q478 106 424 106H175" fill="none" stroke="url(#auth-route)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M530 350H130V332H110V314H90V296H70V288Q70 240 123 240H418V220H438V200H458V180H478V159Q478 106 424 106H175" pathLength="100" fill="none" stroke="#bd8bff" strokeWidth="6" strokeLinecap="round" className="route-light-trail" aria-hidden="true"/>
        <g fill="none" stroke="#b297d8" strokeWidth="1.5"><path d="M415 324H332m0 0 6-4m-6 4 6 4M271 218H341m0 0-6-4m6 4-6 4"/></g>
        {/* Starting milestone. */}
        <circle cx="530" cy="350" r="18" fill="#a8dfe4"/><circle cx="530" cy="350" r="6" fill="#29aabb"/>


        <circle cx="231" cy="350" r="15" fill="#a68bdb"/>


        {/* Person moving left along the first stretch. */}
        <g transform="translate(403 257)">
          <path d="M-6 46-13 72-19 89M2 46 7 67 17 89" stroke="#392166" strokeWidth="9" fill="none" strokeLinejoin="round"/>
          <path d="M-25 92h13m23 0h13" stroke="#392166" strokeWidth="3" strokeLinecap="round"/>
          <path d="m-10 7 15 2 6 39-23 1Z" fill="#9471e1"/>
          <path d="m-9 14-15-9-5-17M7 16 19 27 10 36" stroke="#9471e1" strokeWidth="6" fill="none" strokeLinecap="round"/>
          <path d="m-29-12-2-9M10 36l-4 5" stroke="#edb39a" strokeWidth="4" strokeLinecap="round"/>
          <path d="M-4 5v6" stroke="#edb39a" strokeWidth="6"/>
          <ellipse cx="-4" cy="-3" rx="7" ry="9" fill="#edb39a"/><path d="M-11-4q-4-13 8-10 10 4 4 10l-5-5-3 6Z" fill="#362260"/>
          <path d="m-8 43 13-2" stroke="#fff" strokeWidth="2"/>
        </g>
        {/* Person climbing the lower staircase. */}
        <g transform="translate(123 221)">
          <path d="m7 59-6 26-3 40M10 61 30 78 49 67" fill="none" stroke="#432173" strokeWidth="8" strokeLinejoin="round"/>
          <path d="M-4 127h10m42-62 5 8" stroke="#432173" strokeWidth="3" strokeLinecap="round"/>
          <path d="m3 23 11-2 8 40-23 2Z" fill="#18b1bd"/>
          <path d="M7 29-14 12-12-8M16 29 30 41 17 49" fill="none" stroke="#18b1bd" strokeWidth="6" strokeLinecap="round"/>
          <path d="m-12-8 1-8M17 49l-4 3" stroke="#d99b83" strokeWidth="4" strokeLinecap="round"/>
          <path d="m9 17 1 8" stroke="#d99b83" strokeWidth="6"/>
          <ellipse cx="8" cy="12" rx="7" ry="9" fill="#d99b83"/><path d="M2 13Q-5 1 8 1l8 6-7 3-3 9Z" fill="#392166"/><circle cx="18" cy="3" r="6" fill="#392166"/>
        </g>
        {/* SQL is the next milestone, not a market statistic. */}
        <circle cx="280" cy="240" r="25" className="route-halo route-halo-next" fill="none" stroke="#ffb396" strokeWidth="1.5"/>
        <circle cx="280" cy="240" r="25" fill="#ffede4"/><circle cx="280" cy="240" r="17" fill="#ff8868"/>
        <path d="M280 232v16m-8-8h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>


        {/* Person advancing up the upper staircase. */}
        <g transform="translate(398 120)">
          <path d="m-8 45-13 26-18 47M-5 47 17 64-29 82" fill="none" stroke="#432173" strokeWidth="8" strokeLinejoin="round"/>
          <path d="M-45 119h12m4-35 1 9" stroke="#432173" strokeWidth="3" strokeLinecap="round"/>
          <path d="m-7 9 15 7-11 37-21-10Z" fill="#b5a0ee"/>
          <path d="M-5 16-20 3-39 15M4 22 23 37 43 40" fill="none" stroke="#b5a0ee" strokeWidth="6" strokeLinecap="round"/>
          <path d="m-39 15-6 3m88 22 6-2" stroke="#d99b83" strokeWidth="3" strokeLinecap="round"/>
          <path d="m5 6-3 10" stroke="#d99b83" strokeWidth="6"/><ellipse cx="7" cy="2" rx="6" ry="8" fill="#d99b83"/><path d="M1 4Q-2-10 9-9q11 5 2 13l-1-8-5 1v7Z" fill="#392166"/>
        </g>
        <circle cx="365" cy="106" r="12" fill="#31bfe4"/>
        <path d="M175 80V28" stroke="#7243b4" strokeWidth="2"/>
        <path className="route-flag" d="M175 29q15-14 32-3t30 0l-8 11 8 7q-17 8-32-2t-30 1Z" fill="#9261e6"/>
        <circle cx="175" cy="106" r="31" className="route-halo" fill="none" stroke="#30c6ca" strokeWidth="1.5"/>
        <circle cx="175" cy="106" r="25" fill="url(#auth-finish)"/>
        <path d="m162 105 9 9 18-20" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>


        {/* Soft highlights and a foreground explorer give the map depth. */}
        <g fill="url(#auth-node-shine)" aria-hidden="true"><circle cx="175" cy="106" r="25"/><circle cx="280" cy="240" r="17"/><circle cx="365" cy="106" r="12"/><circle cx="231" cy="350" r="15"/></g>
        <ellipse cx="303" cy="402" rx="24" ry="4" fill="#bba5da" opacity=".2"/>
        <g transform="translate(303 301)">
          <path d="m-7 53-2 21-5 22M3 53l6 22 5 21" stroke="#34bce4" strokeWidth="7" fill="none" strokeLinejoin="round"/>
          <path d="M-19 99h10m20 0h9" stroke="#392166" strokeWidth="3" strokeLinecap="round"/>
          <path d="m-9 15 9-5 9 6 4 40-27-1Z" fill="#392166"/>
          <path d="m-3 12 5 1 3 26-5 7-5-10Z" fill="#fff"/>
          <path d="m0 17 3 4-2 17-3-3Z" fill="#22b6d1"/>
          <path d="m-10 20-11 11-7-14M10 21l13 12-13 16" stroke="#392166" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path d="m-28 17-1-7m39 39-5 3" stroke="#d99b83" strokeWidth="3" strokeLinecap="round"/>
          <path d="M0 8v6" stroke="#d99b83" strokeWidth="5"/>
          <ellipse cx="1" cy="3" rx="6" ry="8" fill="#d99b83"/><path d="M-5 3q-2-14 8-10 8 1 4 10l-3-7-5 3-1 6Z" fill="#392166"/>
          <path d="m-31 6 6-1 2 10-6 1Z" fill="#7654b5"/>
        </g>
        <g aria-hidden="true" className="route-sparkles">
          {[{x:96,y:142,s:1},{x:244,y:58,s:.75},{x:519,y:176,s:1.15},{x:204,y:286,s:.6},{x:444,y:384,s:.85},{x:340,y:166,s:.7},{x:47,y:269,s:.65}].map(({x,y,s},i) => <g key={i} transform={`translate(${x} ${y}) scale(${s})`}><path className={`route-sparkle route-sparkle-${i}`} d="M0-8Q1-1 8 0Q1 1 0 8Q-1 1-8 0Q-1-1 0-8Z" fill={i%2 ? "#bf8bfa" : "#f4b486"}/></g>)}
        </g>
      </svg>

    </figure>
  );
}

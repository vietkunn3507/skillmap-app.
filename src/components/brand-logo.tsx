/** Render the supplied artwork directly, preserving its symbol and wordmark. */
export function BrandLogo() {
  return (
    <svg className="brand-logo" viewBox="0 0 158 44" width="142" height="40" role="img" aria-label="SkillMAP">
      <svg x="0" y="0" width="36" height="44" viewBox="396 181 466 576" preserveAspectRatio="xMidYMid meet" overflow="hidden">
        <image href="/images/skillmap-official.png" width="1254" height="1254" />
      </svg>
      <svg x="44" y="11" width="114" height="23" viewBox="148 782 960 180" preserveAspectRatio="xMidYMid meet" overflow="hidden">
        <image href="/images/skillmap-official.png" width="1254" height="1254" />
      </svg>
    </svg>
  );
}

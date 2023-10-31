uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform float iTime;
uniform vec3 iResolution;

float rand(vec2 n) { return 0.5 + 0.5 * fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453); }

float water(vec3 p) {
    float t = iTime / 20.;
    p.z += t * 2.; p.x += t * 2.;
    // vec3 c1 = texture2D(iChannel2, p.xz / 15.).xyz;
    vec3 c1 = texture2D(iChannel2, p.xz/30.).xyz;
    p.z += t * 3.; p.x += t * 0.52;
    // vec3 c2 = texture2D(iChannel2, p.xz / 15.).xyz;
    vec3 c2 = texture2D(iChannel2, p.xz/30.).xyz;
    p.z += t * 4.; p.x += t * 0.8;
    // vec3 c3 = texture2D(iChannel2, p.xz / 15.).xyz;
    vec3 c3 = texture2D(iChannel2, p.xz/30.).xyz;
    c1 += c2 - c3;
    float z = (c1.x + c1.y + c1.z) / 3.;
    return p.y + z / 4.;
}


float map(vec3 p) {
    float d = 100.0;
    d = water(p);
    return d;
}

float intersect(vec3 ro, vec3 rd) {
    float d = 0.0;
    for (int i = 0; i <= 100; i++) {
        float h = map(ro + rd * d);
        if (h < 0.01) return  d;
        d += h;
    }
    return 0.0;
}

vec3 norm(vec3 p) {
    float eps = .1;
    return normalize(vec3(
        map(p + vec3(eps, 0, 0)) - map(p + vec3(-eps, 0, 0)),
        map(p + vec3(0, eps, 0)) - map(p + vec3(0, -eps, 0)),
        map(p + vec3(0, 0, eps)) - map(p + vec3(0, 0, -eps))
    ));
}

void getAlbedo() {
    vec2 uv = 1.0 - 2.0 *$UV;
    uv.x *= iResolution.x/ iResolution.y;

    vec3 l1 = normalize(vec3(1, 1, 1));
    vec3 ro = vec3(-3, 7, -5);
    vec3 rc = vec3(0, 0, 0);
    vec3 ww = normalize(rc - ro);
    vec3 uu = normalize(cross(vec3(0,1,0), ww));
    vec3 vv = normalize(cross(rc - ro, uu));
    vec3 rd = normalize(uu * uv.x + vv * uv.y + ww);
    float d = intersect(ro, rd);
    vec3 c = vec3(0.0);
    if (d > 0.0) {
        vec3 p = ro + rd * d;
        vec3 n = norm(p);
        float spc = pow(max(0.0, dot(reflect(l1, n), rd)), 5.0);
        vec3 rfa = texture2D(iChannel1, (p+n).xz / 6.0).xyz * (8./d);
        c = rfa.xyz + 0.05 + spc;
    }
    dAlbedo = c;
}
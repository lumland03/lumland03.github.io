const POKE_API = 'https://pokeapi.co/api/v2';

// Generation derived from national dex ID — no extra API call needed
const GEN_RANGES = {
    1: [1, 151],   2: [152, 251],  3: [252, 386],
    4: [387, 493], 5: [494, 649],  6: [650, 721],
    7: [722, 809], 8: [810, 905],  9: [906, 1025],
};

const grid         = document.querySelector('.content-grid');
const searchInput  = document.getElementById('pokemon-search');
const typeSelect   = document.getElementById('type-filter');
const evoSelect    = document.getElementById('evolution-filter');
const genSelect    = document.getElementById('generation-filter');

const detailCache = new Map(); // id  -> { id, name, sprite, types, evolutionStage }
const chainCache  = new Map(); // url -> chain object (shared across an evo family)

let allPokemon = []; // [{ name, url, id }]

// ── HELPERS ────────────────────────────────────────────────

function idFromUrl(url) {
    return parseInt(url.split('/').filter(Boolean).pop());
}

function generationOf(id) {
    for (const [gen, [min, max]] of Object.entries(GEN_RANGES)) {
        if (id >= min && id <= max) return parseInt(gen);
    }
    return null;
}

function detectStage(chain, name) {
    if (chain.species.name === name) {
        return chain.evolves_to.length === 0 ? 'final' : 'base';
    }
    for (const s2 of chain.evolves_to) {
        if (s2.species.name === name) {
            return s2.evolves_to.length === 0 ? 'final' : 'middle';
        }
        for (const s3 of s2.evolves_to) {
            if (s3.species.name === name) return 'final';
        }
    }
    return 'base';
}

// ── FETCHING ───────────────────────────────────────────────

async function fetchDetail(id) {
    if (detailCache.has(id)) return detailCache.get(id);

    const res  = await fetch(`${POKE_API}/pokemon/${id}`);
    const data = await res.json();

    const types  = data.types.map(t => t.type.name);
    const sprite = data.sprites.front_default ?? '';

    // Evolution stage: species → chain (chain URL is cached so each chain is
    // fetched only once, ~478 unique chains for all 1025 Pokémon)
    let evolutionStage = 'unknown';
    try {
        const specRes  = await fetch(data.species.url);
        const species  = await specRes.json();
        const chainUrl = species.evolution_chain.url;

        if (!chainCache.has(chainUrl)) {
            const chainRes = await fetch(chainUrl);
            const chainData = await chainRes.json();
            chainCache.set(chainUrl, chainData.chain);
        }
        evolutionStage = detectStage(chainCache.get(chainUrl), data.name);
    } catch (_) { /* leave as unknown */ }

    const result = { id, name: data.name, sprite, types, evolutionStage };
    detailCache.set(id, result);
    return result;
}

// ── RENDERING ──────────────────────────────────────────────

function cardHTML(data) {
    const types = data.types
        .map(t => `<span class="type-badge type-${t}">${t}</span>`)
        .join('');
    return `
        <img class="poke-card-img" src="${data.sprite}" alt="${data.name}" loading="lazy">
        <p class="poke-card-name">${data.name}</p>
        <div class="poke-card-types">${types}</div>`;
}

function skeletonHTML(name) {
    return `
        <div class="poke-card-img skeleton"></div>
        <p class="poke-card-name">${name}</p>
        <div class="poke-card-types"></div>`;
}

function updateCard(id) {
    const card = grid.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    const data = detailCache.get(id);
    if (!data) return;
    card.innerHTML = cardHTML(data);

    // Remove card if a loaded filter now excludes it
    const type = typeSelect.value;
    const evo  = evoSelect.value;
    if ((type && !data.types.includes(type)) ||
        (evo  && data.evolutionStage !== evo && data.evolutionStage !== 'unknown')) {
        card.remove();
    }
}

function renderGrid(list) {
    grid.innerHTML = '';
    list.forEach(p => {
        const card = document.createElement('div');
        card.className  = 'poke-card';
        card.dataset.id = p.id;

        if (detailCache.has(p.id)) {
            card.innerHTML = cardHTML(detailCache.get(p.id));
        } else {
            card.innerHTML = skeletonHTML(p.name);
            lazyObserver.observe(card);
        }
        grid.appendChild(card);
    });
}

// ── FILTERING ──────────────────────────────────────────────

function getFiltered() {
    const search = searchInput.value.toLowerCase().trim();
    const type   = typeSelect.value;
    const evo    = evoSelect.value;
    const gen    = genSelect.value ? parseInt(genSelect.value) : '';

    return allPokemon.filter(p => {
        if (search && !p.name.includes(search)) return false;
        if (gen    && generationOf(p.id) !== gen) return false;

        const data = detailCache.get(p.id);
        // Not yet loaded → show optimistically (will be re-evaluated on load)
        if ((type || evo) && !data) return true;
        if (type && data && !data.types.includes(type)) return false;
        if (evo  && data && data.evolutionStage !== evo &&
            data.evolutionStage !== 'unknown') return false;

        return true;
    });
}

function applyFilters() {
    renderGrid(getFiltered());
}

// ── LAZY OBSERVER ──────────────────────────────────────────

const lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        lazyObserver.unobserve(card);
        fetchDetail(parseInt(card.dataset.id)).then(() =>
            updateCard(parseInt(card.dataset.id))
        );
    });
}, { rootMargin: '400px' }); // start loading 400px before entering view

// ── BACKGROUND PREFETCH ────────────────────────────────────
// Fetches all Pokémon details silently in batches so filters
// work on the full data set without the user having to scroll.

async function prefetchAll() {
    const BATCH = 20;
    for (let i = 0; i < allPokemon.length; i += BATCH) {
        const batch = allPokemon.slice(i, i + BATCH);
        await Promise.all(batch.map(p => fetchDetail(p.id)));
        batch.forEach(p => updateCard(p.id));
    }
}

// ── INIT ───────────────────────────────────────────────────

async function init() {
    const res  = await fetch(`${POKE_API}/pokemon?limit=1025`);
    const data = await res.json();

    allPokemon = data.results.map(p => ({
        name: p.name,
        url:  p.url,
        id:   idFromUrl(p.url),
    }));

    renderGrid(allPokemon); // instant — all skeletons appear immediately
    prefetchAll();          // fills in details quietly in the background
}

searchInput.addEventListener('input',  applyFilters);
typeSelect.addEventListener('change',  applyFilters);
evoSelect.addEventListener('change',   applyFilters);
genSelect.addEventListener('change',   applyFilters);

init();

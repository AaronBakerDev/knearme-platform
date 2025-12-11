export function TrustBar() {
    return (
        <section className="border-y border-zinc-100 bg-white py-12 dark:border-zinc-800 dark:bg-black">
            <div className="container mx-auto px-4 text-center">
                <p className="mb-8 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Trusted by modern masonry pros
                </p>
                <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 grayscale opacity-70">
                    {/* Placeholders for now, simulated with text/icons */}
                    <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-full"></div> MasonryCo</div>
                    <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-full"></div> BrickMasters</div>
                    <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-full"></div> SolidBuild</div>
                    <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-zinc-800 rounded-full"></div> EliteStone</div>
                </div>
            </div>
        </section>
    );
}

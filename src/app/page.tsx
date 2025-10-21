import Link from "next/link";
import { allPosts } from 'contentlayer/generated'
import { compareDesc } from 'date-fns'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/motion/PageTransition'
import { ScrollReveal, TextReveal } from '@/components/motion/ScrollEffects'
export default function Home() {
  const publishedPosts = allPosts.filter((post) => !post.draft)
  const sorted = publishedPosts.sort((a, b) =>
    compareDesc(new Date(a.publishedAt), new Date(b.publishedAt))
  )
  const recentPosts = sorted.slice(0, 3)

  return (
    <PageTransition>
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-5xl mx-auto text-center">
            <ScrollReveal>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500">
                WebGPU
                <br />
                <span className="text-5xl md:text-7xl lg:text-8xl">Creative Lab</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
                Exploring the future of 3D graphics on the web with Three.js Shading Language,
                React Three Fiber, and cutting-edge GPU compute.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/blog"
                  className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-full font-semibold transition-all hover:scale-105"
                >
                  Read Articles
                </Link>
                <Link
                  href="/labs"
                  className="px-8 py-4 border border-gray-700 hover:border-gray-600 rounded-full font-semibold transition-all hover:scale-105"
                >
                  Explore Labs
                </Link>
                <Link
                  href="/admin"
                  className="px-8 py-4 border border-gray-800 hover:border-purple-600 rounded-full font-semibold transition-all text-gray-400 hover:text-purple-400"
                >
                  Admin
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <TextReveal className="text-4xl md:text-5xl font-bold mb-20 text-center">
              Built with Modern Web Technologies
            </TextReveal>

            <StaggerContainer className="grid md:grid-cols-3 gap-8">
              <StaggerItem>
                <FeatureCard
                  title="WebGPU First"
                  description="Leveraging the next-generation graphics API for unprecedented performance and capabilities."
                  icon="🚀"
                />
              </StaggerItem>

              <StaggerItem>
                <FeatureCard
                  title="TSL Shaders"
                  description="Node-based shader system with type safety and reusable components."
                  icon="✨"
                />
              </StaggerItem>

              <StaggerItem>
                <FeatureCard
                  title="Engine First"
                  description="Persistent 3D canvas across routes with seamless scene transitions."
                  icon="🎨"
                />
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <section className="py-32 px-6 bg-gray-900/30">
            <div className="max-w-6xl mx-auto">
              <ScrollReveal>
                <h2 className="text-4xl md:text-5xl font-bold mb-12">Recent Articles</h2>
              </ScrollReveal>

              <StaggerContainer className="grid md:grid-cols-3 gap-6">
                {recentPosts.map((post) => (
                  <StaggerItem key={post.slug}>
                    <Link
                      href={post.url}
                      className="block group p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 transition-all hover:scale-[1.02]"
                    >
                      <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {post.summary}
                      </p>
                      <span className="text-purple-400 text-sm">
                        Read more →
                      </span>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <ScrollReveal delay={0.3}>
                <div className="text-center mt-12">
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    View all articles →
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </section>
        )}
      </main>
    </PageTransition>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-8 rounded-2xl bg-gray-900/30 border border-gray-800 hover:border-purple-500/30 transition-all group">
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

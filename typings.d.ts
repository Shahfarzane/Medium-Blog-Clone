export interface Post {
  _id: string
  _createdAt: string
  _updatedAt: string
  publishedAt: string
  _rev: string
  title: string
  author: {
    name: string
    image: string
  }
  description: string
  mainImage: {
    asset: {
      url: string
    }
  }
  slug: {
    current: string
  }
  body: [object]
}

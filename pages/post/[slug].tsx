import { groq } from 'next-sanity'
import React from 'react'
import { sanityClient, urlFor } from '../../sanity'
import Header from '../components/Header'
import { Post } from '../../typings'
import { GetStaticProps } from 'next'

interface Props {
  post: Post
}
function Post({ post }: Props) {
  return (
    <main>
      <Header />
    </main>
  )
}
export default Post
export const getStaticPaths = async () => {
  const query = groq`
  *[_type == "post" ]{
    _id,
    slug {
      current
    }
  }
`
  const posts = await sanityClient.fetch(query)

  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }))

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    author->{
    name,
    image
  },
description,
mainImage,
slug
  }`

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  })

  if (!post) {
    return {
      notFound: true,
    }
  }
  return {
    props: {
      post,
    },
    revalidate: 60,
  }
}

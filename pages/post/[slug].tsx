import { groq } from 'next-sanity'
import React, { useState } from 'react'
import { sanityClient, urlFor } from '../../sanity'
import Header from '../components/Header'
import { Post } from '../../typings'
import { GetStaticProps } from 'next'
import PortableText from 'react-portable-text'
import { useForm, SubmitHandler } from 'react-hook-form'

interface IFormInput {
  _id: string
  name: string
  email: string
  comment: string
}
interface Props {
  post: Post
}

function Post({ post }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>()

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    console.log(data)
    fetch('/api/createComment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(() => {
        console.log(data)
        setSubmitted(true)
      })
      .catch((err) => {
        console.log(err)
        setSubmitted(false)
      })
  }
  console.log(post)
  return (
    <main>
      <Header />

      <img
        className="w-full h-64 object-cover"
        src={urlFor(post.mainImage).url()!}
      />
      <article className="max-w-3xl mx-auto p-5">
        <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
        <h2 className="text-xl font-light text-gray-500 mb-2">
          {post.description}
        </h2>
        <div className="flex items-center space-x-2">
          <img
            className="h-10 w-10 rounded-full"
            src={urlFor(post.author.image).url()!}
          />
          <p className="font-extralight text-sm">
            Blog post by{' '}
            <span className="text-green-600">{post.author.name} </span>-
            Published at {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>
        <div className=" mt-10">
          <PortableText
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
            content={post.body}
            serializers={{
              h1: (props: any) => (
                <h1 className="text-2xl font-bold my-5" {...props} />
              ),
              h2: (props: any) => (
                <h2 className="text-xl font-bold my-5" {...props} />
              ),
              li: ({ children }: any) => (
                <li className="ml-4 list-disc">{children}</li>
              ),
              link: ({ href, children }: any) => (
                <a href={href} className="text-blue-500 hover:underline">
                  {children}
                </a>
              ),
            }}
          />
        </div>
      </article>
      <hr className="max-w-lg my-5 mx-auto border border-yellow-500" />
      {submitted ? (
        <div className="my-10 mx-auto flex max-w-2xl flex-col bg-yellow-500 py-10 px-5 text-white">
          <h3 className="text-xl font-bold">
            Thanks for submitting your comment!
          </h3>
          <p>Once it has been approved, it will appear bellow!</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="my-10 mx-auto flex max-w-2xl flex-col p-5"
        >
          <h3 className="text-md text-yellow-500">Enjoyed this article?</h3>
          <h4 className="text-2xl font-bold">Leave a comment bellow!</h4>
          <hr className="mt-2 py-3" />

          <label className="mb-5 block">
            <div className="flex justify-between">
              <span className="text-gary-700">Name</span>

              {errors.name && (
                <span className="text-red-500">This field is required!</span>
              )}
            </div>

            <input
              {...register('name', { required: true })}
              className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring-1"
              placeholder="John Doe"
              type="text"
            />
          </label>

          <label className="mb-5 block">
            <div className="flex justify-between">
              <span className="text-gary-700">Email</span>

              {errors.email && (
                <span className="text-red-500">This field is required!</span>
              )}
            </div>

            <input
              {...register('email', { required: true })}
              className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring-1"
              placeholder="john.doe@gmail.com"
              type="email"
            />
          </label>

          <label className="mb-5 block">
            <div className="flex justify-between">
              <span className="text-gary-700">Comment</span>

              {errors.comment && (
                <span className="text-red-500">This field is required!</span>
              )}
            </div>

            <textarea
              {...register('comment', { required: true })}
              className="form-textarea mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring-1"
              placeholder="Type you comment..."
              rows={8}
            />
          </label>

          <input
            className="focus:shadow-outline none cursor-pointer rounded bg-yellow-500 py-2 px-4 font-bold text-white shadow outline-none hover:bg-yellow-400"
            type="submit"
          />
        </form>
      )}

      <div className="my-10 mx-auto flex max-w-2xl flex-col space-y-2 p-10 shadow shadow-yellow-500">
        <h3 className="pb-2 text-4xl">Comments</h3>

        <hr className="pb-4" />

        {post.comments.map((comment) => {
          return (
            <div key={comment._id}>
              <p>
                <span className="text-yellow-500">{comment.name}: </span>
                {comment.comment}
              </p>
            </div>
          )
        })}
      </div>
    </main>
  )
}

export default Post

export const getStaticPaths = async () => {
  const query = `
    *[_type == "post"]{
        _id,
         slug{
         current
        }
    }`
  const posts = await sanityClient.fetch(query)

  // Creates a list of paths
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
  const query = `
    *[_type == "post" && slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author-> {
        name,
        image
        },
         'comments': *[
          _type == 'comment' &&
          post._ref == ^._id &&
          approved == true
        ],
        description,
        mainImage,
        slug,
        body
      }
    `

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
    revalidate: 60, // After 60 seconds, it will update the older cached version
  }
}

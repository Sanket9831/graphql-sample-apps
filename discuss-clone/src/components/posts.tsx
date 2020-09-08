import React, { useState } from "react"
import {
  Button,
  Modal,
  Header,
  Label,
  Loader,
  Image,
  Table,
  Dropdown,
  Input,
  Form,
  TextArea,
} from "semantic-ui-react"
import { useAuth0 } from "@auth0/auth0-react"
import {
  useAllPostsQuery,
  useAddPostMutation,
  AllPostsDocument,
  AllPostsQuery,
} from "./types/operations"
import { useCategories } from "./categories"
import { Link } from "react-router-dom"
import { avatar } from "./avatar"

export function PostFeed() {
  const { isAuthenticated, user } = useAuth0()

  const { data, loading, error } = useAllPostsQuery()

  const {
    allCategories,
    allWriteableCategories,
    loading: catLoading,
    error: catError,
  } = useCategories(user?.email ?? "")

  const [addPost] = useAddPostMutation({
    update(cache, { data }) {
      const existing = cache.readQuery<AllPostsQuery>({
        query: AllPostsDocument,
      })

      cache.writeQuery({
        query: AllPostsDocument,
        data: {
          queryPost: [
            ...(data?.addPost?.post ?? []),
            ...(existing?.queryPost ?? []),
          ],
        },
      })
    },
  })

  const [createPost, setCreatePost] = useState(false)
  const [title, setTitle] = useState("")
  const [tags, setTags]: any = useState([])
  const [category, setCategory]: any = useState("")
  const [text, setText]: any = useState("")

  const tagsOptions: Array<{key: string, text: string, value: string}> = []

  if (loading || catLoading) return <Loader />
  if (error) return `Error! ${error.message}`
  if (catError) return `Error! ${catError.message}`

  const categoriesOptions = allCategories.map((category) => {
    return { key: category?.id, text: category?.name, value: category?.id }
  })

  const writableCategoriesOptions = allWriteableCategories.map((category) => {
    return { key: category?.id, text: category?.name, value: category?.id }
  })

  const canAddPosts = isAuthenticated && allWriteableCategories.length > 0

  const createTags = (tagsSet: any) => {
    let tags: string = "";
      tagsSet.forEach((tag: string) => {
        tags += tag + ",";
      });
    setTags(tags.substring(0, tags.length - 1));
  }

  const submitPost = () => {
    setCreatePost(false)
    const post = {
      text: text,
      title: title,
      tags: tags,
      likes: 0,
      category: { id: category },
      author: { username: user.email },
      datePublished: new Date().toISOString(),
      comments: [],
    }
    addPost({ variables: { post: post } })
  }

  const showCreatePost = (
    <Modal
      onClose={() => setCreatePost(false)}
      onOpen={() => setCreatePost(true)}
      open={createPost}
    >
      <Modal.Header>Create a New Post</Modal.Header>
      <Modal.Content>
        <Modal.Description>
          <Form>
            <Form.Field>
              <label>Title</label>
              <input
                placeholder="Type title..."
                style={{
                  backgroundColor: "#f3f3f3",
                }}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Field>
            <Form.Field>
              <label>Category</label>
              <Dropdown
                placeholder="You must select a category to continue..."
                fluid
                search
                selection
                options={writableCategoriesOptions}
                style={{
                  backgroundColor: "#f3f3f3",
                }}
                onChange={(e, data) => setCategory(data.value)}
              />
            </Form.Field>
            <Form.Field>
              <label>Tags (optional)</label>
              <Dropdown
                placeholder="Select appropriate tags..."
                fluid
                multiple
                search
                selection
                options={tagsOptions}
                style={{
                  backgroundColor: "#f3f3f3",
                }}
                onChange={(e, data) => createTags(data.value)}
              />
            </Form.Field>
            <Form.Field>
              <label>Your Message</label>
              <TextArea
                rows="3"
                placholder="Enter your message..."
                style={{
                  backgroundColor: "#f3f3f3",
                }}
                onChange={(e, data) => setText(data.value)}
              />
            </Form.Field>
          </Form>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button color="black" onClick={() => setCreatePost(false)}>
          Cancel
        </Button>
        <Button
          content="Submit"
          labelPosition="right"
          icon="checkmark"
          onClick={submitPost}
          positive
        />
      </Modal.Actions>
    </Modal>
  )

  const items = data?.queryPost?.map((post) => {
    const likes = post?.likes ?? 0
    const tagsArray = post?.tags?.split(",") || []
   tagsArray.forEach((tag) => {
     if (tagsOptions.findIndex((x) => x["key"] === tag) === -1) {
       tagsOptions.push({ key: tag, text: tag, value: tag });
     }
    })

    return (
      <Table.Row key={post?.id}>
        <Table.Cell>
          <Link
            to={{
              pathname: "/post/" + post?.id,
              state: {
                categoriesOptions: categoriesOptions,
                tagsOptions: tagsOptions,
              },
            }}
          >
            {/* <a href={"/post/" + post?.id} style={{ color: "black" }}> */}
            <Header as="h4" image>
              <Image src={avatar(post?.author.avatarImg)} rounded size="mini" />
              <Header.Content>
                {post?.title}
                <Header.Subheader>{post?.author.displayName}</Header.Subheader>
              </Header.Content>
            </Header>
            {/* </a> */}
          </Link>
        </Table.Cell>
        <Table.Cell>
          <span className="ui red empty mini circular label"></span>{" "}
          {" " + post?.category.name}
        </Table.Cell>
        <Table.Cell>
          {tagsArray.map((tag) => {
            return (
              <Label as="a" basic color="grey" key={tag}>
                {tag}
              </Label>
            )
          })}
        </Table.Cell>
        <Table.Cell>
          <p>
            <i className="heart outline icon"></i> {likes} Like
            {likes === 1 ? "" : "s"}
          </p>
          <p>
            {" "}
            <i className="comment outline icon"></i> {post?.comments.length} Replies
          </p>
        </Table.Cell>
      </Table.Row>
    )
  })

  return (
    <>
      {showCreatePost}
      <div style={{ display: "flex", marginBottom: "2rem" }}>
        <Input
          icon="search"
          placeholder="Type any keywords..."
          style={{ marginRight: "10px", backgroundColor: "#f3f3f3" }}
        />
        <Dropdown
          placeholder="Categories"
          fluid
          multiple
          search
          selection
          options={categoriesOptions}
          style={{
            marginRight: "10px",
            width: "20%",
            backgroundColor: "#f3f3f3",
          }}
        />
        <Dropdown
          placeholder="Tags"
          fluid
          multiple
          search
          selection
          options={tagsOptions}
          style={{
            marginRight: "10px",
            width: "20%",
            backgroundColor: "#f3f3f3",
          }}
        />
        {canAddPosts && (
          <button
            className="ui button"
            style={{
              background: "linear-gradient(135deg, #ff1800, #ff009b)",
              color: "white",
            }}
            onClick={() => setCreatePost(true)}
          >
            Create a New Post
          </button>
        )}
      </div>
      <Table basic="very" collapsing style={{ width: "100%" }}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Posts</Table.HeaderCell>
            <Table.HeaderCell>Category</Table.HeaderCell>
            <Table.HeaderCell>Tags</Table.HeaderCell>
            <Table.HeaderCell>Responses</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>{items}</Table.Body>
      </Table>
    </>
  )
}
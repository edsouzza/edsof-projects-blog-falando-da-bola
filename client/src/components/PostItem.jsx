import { Link }   from 'react-router-dom'
import PostAuthor from './PostAuthor'

const PostItem = ({ thumbnail, category, postID, title, description, authorID, createdAt }) => {
  const safeTitle       = title || "";
  const safeDescription = description || "";

  const shortDescription = safeDescription.length > 145
    ? safeDescription.substr(0, 145) + "..."
    : safeDescription;

  const postTitle = safeTitle.length > 30
    ? safeTitle.substr(0, 30) + "..."
    : safeTitle;

  const normalizedDate = createdAt ? new Date(createdAt.replace(' ', 'T')) : null;

  return (
    <article className='post'>
      <div className="post__thumbnail">
        <img src={`${process.env.REACT_APP_ASSET_URL}/uploads/${thumbnail}`} alt={safeTitle} />
      </div>
      <div className="post__content">
        <Link to={`/posts/${postID}`}>
          <h3>{postTitle}</h3>
        </Link>
        <p dangerouslySetInnerHTML={{ __html: shortDescription }} />
        <div className="post__footer">
          
          <PostAuthor authorID={authorID} createdAt={normalizedDate} />
          <Link to={`/posts/categories/${category}`} className='btn category'>{category}</Link>
        </div>
      </div>
    </article>
  );
};


export default PostItem
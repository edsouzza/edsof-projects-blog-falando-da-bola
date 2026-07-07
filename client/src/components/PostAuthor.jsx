import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import ReactTimeAgo from "react-time-ago"
import TimeAgo from 'javascript-time-ago'

import en from 'javascript-time-ago/locale/en.json'
import ru from 'javascript-time-ago/locale/ru.json'
import pt from 'javascript-time-ago/locale/pt.json'
import { UserContext } from '../context/userContext'

TimeAgo.addDefaultLocale(en)
TimeAgo.addLocale(ru)
TimeAgo.addLocale(pt)

const PostAuthor = ({authorID, createdAt}) => {
    const [author, setAuthor] = useState({})

    const normalizedDate = createdAt ? new Date(createdAt) : null;

    console.log("createdAt recebido:", createdAt)
    console.log("Date convertido:", new Date(createdAt))


    
    useEffect(() => {
        const getAuthor = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/${authorID}`)
                setAuthor(response?.data)
            } catch (error) {
                console.log(error)
            }
        }

        getAuthor();
    }, [])

    return (
        <Link to={`/posts/users/${authorID}`} className="post__author">
          <div className="post__author-avatar">
            <img src={`${process.env.REACT_APP_ASSET_URL}/uploads/${author?.avatar || "default-avatar.png"}`} alt={author?.name || "avatar"} />
          </div>
          <div className="post__author-details">
            <h5>By: {author?.name}</h5>
            <small>
              {normalizedDate && !isNaN(normalizedDate.getTime())
                ? <ReactTimeAgo date={normalizedDate} locale="pt" />
                : "Data inválida"}
            </small>
          </div>
        </Link>
    )
}

export default PostAuthor
package comments

import "time"

type Comment struct {
	ID          int64     `json:"id"`
	ArticleID   int64     `json:"article_id"`
	UserID      int64     `json:"user_id"`
	Nickname    string    `json:"nickname"`
	Content     string    `json:"content"`
	ContentHTML string    `json:"content_html"`
	Status      string    `json:"status,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

from django.urls import path
from .views import (
    EpisodeListCreateView,
    EpisodeDetailView,
    ping,
    TopicListCreateView,
    TopicDetailView,
    EpisodeTagManageView,
    TagDetailView,
    CommentCreateListView,
    CommentRepliesView,
    SaveListeningProgressView,
    ContinueListeningListView,
    EpisodeLikeDislikeView,
    SaveContentView,
)

urlpatterns = [
    # Episodes
    path('api/episodes/', EpisodeListCreateView.as_view(), name='episode-list-create'),
    path('api/episode/<slug:slug>/', EpisodeDetailView.as_view(), name='episode-detail'),
    path('api/episode/<slug:slug>/tags/', EpisodeTagManageView.as_view(), name='episode-tag-manage'),
    path('api/episode/<slug:slug>/like-dislike/', EpisodeLikeDislikeView.as_view(), name='episode-like-dislike'),
    path('api/episode/<slug:slug>/save/', SaveContentView.as_view(), name='episode-save'),
    # Topics
    path('api/topics/', TopicListCreateView.as_view(), name='topic-list-create'),
    path('api/topics/<slug:slug>/', TopicDetailView.as_view(), name='topic-detail'),

    path('api/tags/<slug:slug>/', TagDetailView.as_view(), name='tag-detail'),

    # Ping
    path('api/ping/', ping, name='ping'),

    # comments
    path('api/comments/', CommentCreateListView.as_view()),
    path('api/comments/<int:pk>/replies/', CommentRepliesView.as_view()), # GET
    # progress and history
    path('api/listen-progress/', SaveListeningProgressView.as_view(), name='save-listening-progress'),
    path('api/episodes/continue/', ContinueListeningListView.as_view(), name='continue-listening-episodes'),

]

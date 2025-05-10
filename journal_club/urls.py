from django.urls import path
from .views import EpisodeListCreateView, EpisodeDetailView, episode_list_view, episode_detail_view

urlpatterns = [
    path('journal/api/episodes/', EpisodeListCreateView.as_view(), name='episode-list-create'),
    path('journal/api/episodes/<slug:slug>/', EpisodeDetailView.as_view(), name='episode-detail'),
    path('', episode_list_view, name='episode_list'),
    path('episode/<slug:slug>/', episode_detail_view, name='episode_detail'),

]

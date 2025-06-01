from django.urls import path
from .views import NoteListCreateView, NoteDetailView

urlpatterns = [
    path('episodes/<slug:slug>/', NoteListCreateView.as_view(), name='note-list-create'),
    path('<slug:slug>/', NoteDetailView.as_view(), name='note-detail'),
]

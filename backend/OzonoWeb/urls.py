from django.urls import path
from .views import OzonoWebView

urlpatterns = [
    path('',OzonoWebView, name ='app')
]
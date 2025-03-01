document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM - Tela Principal
  const searchForm = document.getElementById('searchForm');
  const topicInput = document.getElementById('topic');
  const subredditSelect = document.getElementById('subreddit');
  const searchButton = document.getElementById('searchButton');
  const searchSpinner = document.getElementById('searchSpinner');
  const resultsSection = document.getElementById('resultsSection');
  const aiSummary = document.getElementById('aiSummary');
  const gridViewBtn = document.getElementById('gridViewBtn');
  const listViewBtn = document.getElementById('listViewBtn');
  const filterSelect = document.getElementById('filterSelect');
  const genreFilters = document.getElementById('genreFilters');
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  // Elementos do DOM - Navegação entre telas
  const mainScreen = document.getElementById('main-screen');
  const debugScreen = document.getElementById('debug-screen');
  const debugModeBtn = document.getElementById('debugModeBtn');
  const backToMainBtn = document.getElementById('backToMainBtn');
  
  // Elementos do DOM - Tela de Debug
  const userQueryInfo = document.getElementById('userQueryInfo');
  const debugTopicValue = document.getElementById('debugTopicValue');
  const debugSubredditValue = document.getElementById('debugSubredditValue');
  const debugTimestampValue = document.getElementById('debugTimestampValue');
  const redditSearchInfo = document.getElementById('redditSearchInfo');
  const debugSearchResults = document.getElementById('debugSearchResults');
  const aggregationInfo = document.getElementById('aggregationInfo');
  const debugAggregatedText = document.getElementById('debugAggregatedText');
  const debugCopyButton = document.getElementById('debugCopyButton');
  const aiAnalysisInfo = document.getElementById('aiAnalysisInfo');
  const debugAiResponse = document.getElementById('debugAiResponse');
  const jikanInfo = document.getElementById('jikanInfo');
  const debugJikanData = document.getElementById('debugJikanData');
  
  // Variáveis globais
  let currentResults = null;
  let currentAggregatedText = '';
  let currentTopic = '';
  let currentSubreddit = '';
  let searchTimestamp = null;
  let timelineItems = document.querySelectorAll('.timeline-item');
  let allGenres = new Set();
  let activeFilters = {
    type: 'all',
    genres: []
  };
  
  // Inicializar timeline
  function initTimeline() {
    timelineItems.forEach(item => {
      const infoSection = item.querySelector('.timeline-info');
      const detailsSection = item.querySelector('.timeline-details');
      
      if (infoSection && detailsSection) {
        infoSection.addEventListener('click', () => {
          // Toggle detalhes
          const isVisible = detailsSection.style.display === 'block';
          detailsSection.style.display = isVisible ? 'none' : 'block';
          
          // Rotacionar ícone ou adicionar indicador visual
          infoSection.classList.toggle('expanded', !isVisible);
        });
      }
    });
  }
  
  // Atualizar status da timeline
  function updateTimelineStatus(step, status, message) {
    const timelineItem = document.querySelector(`.timeline-item[data-step="${step}"]`);
    if (!timelineItem) return;
    
    // Remover classes de status anteriores
    timelineItem.classList.remove('active', 'completed', 'error');
    
    // Adicionar nova classe de status
    if (status === 'active') {
      timelineItem.classList.add('active');
    } else if (status === 'completed') {
      timelineItem.classList.add('completed');
    } else if (status === 'error') {
      timelineItem.classList.add('error');
    }
    
    // Atualizar mensagem de informação
    const infoElement = timelineItem.querySelector('.timeline-info p');
    if (infoElement) {
      infoElement.textContent = message;
    }
  }
  
  // Alternar entre visualizações de grid e lista
  function toggleView(viewType) {
    const container = document.querySelector('.recommendations-container');
    if (!container) return;
    
    if (viewType === 'grid') {
      container.classList.remove('list-view');
      container.classList.add('grid-view');
      gridViewBtn.classList.remove('btn-outline-primary');
      gridViewBtn.classList.add('btn-primary');
      listViewBtn.classList.remove('btn-primary');
      listViewBtn.classList.add('btn-outline-secondary');
    } else {
      container.classList.remove('grid-view');
      container.classList.add('list-view');
      listViewBtn.classList.remove('btn-outline-secondary');
      listViewBtn.classList.add('btn-primary');
      gridViewBtn.classList.remove('btn-primary');
      gridViewBtn.classList.add('btn-outline-primary');
    }
  }
  
  // Alternar entre telas
  function switchScreen(screenId) {
    if (screenId === 'main') {
      mainScreen.classList.add('active');
      debugScreen.classList.remove('active');
    } else if (screenId === 'debug') {
      debugScreen.classList.add('active');
      mainScreen.classList.remove('active');
    }
  }
  
  // Carregar subreddits suportados
  async function loadSubreddits() {
    try {
      updateTimelineStatus('input', 'active', 'Carregando comunidades disponíveis...');
      
      const response = await fetch('/api/subreddits');
      const data = await response.json();
      
      if (data.subreddits && Array.isArray(data.subreddits)) {
        // Limpar opções existentes
        subredditSelect.innerHTML = '';
        
        // Adicionar opções para cada subreddit
        data.subreddits.forEach(subreddit => {
          const option = document.createElement('option');
          option.value = subreddit;
          option.textContent = `r/${subreddit}`;
          subredditSelect.appendChild(option);
        });
        
        // Selecionar o primeiro subreddit por padrão
        if (data.subreddits.length > 0) {
          subredditSelect.value = data.subreddits[0];
        }
        
        updateTimelineStatus('input', 'completed', `${data.subreddits.length} comunidades carregadas`);
      }
    } catch (error) {
      console.error('Erro ao carregar subreddits:', error);
      subredditSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar comunidades</option>';
      updateTimelineStatus('input', 'error', 'Erro ao carregar comunidades');
    }
  }

  // Pesquisar no Reddit
  async function searchReddit(topic, subreddit) {
    try {
      // Armazenar o tópico atual e timestamp
      currentTopic = topic;
      currentSubreddit = subreddit;
      searchTimestamp = new Date();
      
      // Limpar filtros anteriores
      resetFilters();
      
      // Atualizar informações de debug
      debugTopicValue.textContent = topic;
      debugSubredditValue.textContent = subreddit;
      debugTimestampValue.textContent = searchTimestamp.toLocaleString();
      userQueryInfo.textContent = `Pesquisa por "${topic}" em r/${subreddit}`;
      
      // Atualizar status da timeline
      updateTimelineStatus('input', 'completed', `Consulta: "${topic}" em r/${subreddit}`);
      updateTimelineStatus('reddit', 'active', 'Buscando posts no Reddit...');
      updateTimelineStatus('aggregate', 'active', 'Aguardando busca no Reddit...');
      updateTimelineStatus('ai', 'active', 'Aguardando agregação...');
      updateTimelineStatus('jikan', 'active', 'Aguardando análise da IA...');
      
      // Mostrar spinner
      searchSpinner.classList.remove('d-none');
      searchButton.disabled = true;
      
      // Mostrar seção de resultados com spinner
      resultsSection.style.display = 'block';
      loadingIndicator.style.display = 'block';
      aiSummary.innerHTML = '';
      
      // Scroll suave para a seção de resultados
      window.scrollTo({
        top: resultsSection.offsetTop - 100,
        behavior: 'smooth'
      });
      
      const response = await fetch('/api/search-and-summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic, subreddit })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        currentResults = data;
        
        // Atualizar status da timeline
        updateTimelineStatus('reddit', 'completed', `${data.searchResults ? data.searchResults.length : 0} posts encontrados`);
        
        // Exibir resultados da busca na tela de debug
        displayDebugSearchResults(data);
        
        // Atualizar informações de agregação
        if (data.aggregatedText) {
          currentAggregatedText = data.aggregatedText;
          debugAggregatedText.textContent = data.aggregatedText;
          updateTimelineStatus('aggregate', 'completed', `${data.aggregatedText.length} caracteres agregados`);
        } else {
          updateTimelineStatus('aggregate', 'error', 'Falha na agregação de comentários');
        }
        
        // Atualizar informações da IA
        if (data.summary) {
          debugAiResponse.textContent = JSON.stringify(data.summary, null, 2);
          updateTimelineStatus('ai', 'completed', `${data.summary.recomendacoes ? data.summary.recomendacoes.length : 0} recomendações geradas`);
          
          // Verificar se há informações do Jikan
          const hasJikanInfo = data.summary.recomendacoes && 
                              data.summary.recomendacoes.some(rec => rec.jikanInfo);
          
          if (hasJikanInfo) {
            const enrichedCount = data.summary.recomendacoes.filter(rec => rec.jikanInfo).length;
            updateTimelineStatus('jikan', 'completed', `${enrichedCount} itens enriquecidos com dados adicionais`);
            
            // Exibir dados do Jikan na tela de debug
            displayDebugJikanData(data.summary.recomendacoes);
            
            // Extrair gêneros para filtros
            extractGenres(data.summary.recomendacoes);
          } else {
            updateTimelineStatus('jikan', 'error', 'Nenhuma informação adicional disponível');
          }
          
          // Exibir recomendações na tela principal
          displayAISummary(data.summary);
          
          // Mostrar botão de debug após ter recomendações
          debugModeBtn.classList.remove('d-none');
        } else {
          updateTimelineStatus('ai', 'error', 'Falha na análise com IA');
          updateTimelineStatus('jikan', 'error', 'Processo interrompido');
          
          loadingIndicator.style.display = 'none';
          aiSummary.innerHTML = `
            <div class="alert alert-danger">
              <strong>Erro:</strong> Não foi possível gerar recomendações para esta pesquisa.
            </div>
          `;
        }
      } else {
        throw new Error(data.message || 'Erro ao buscar dados do Reddit');
      }
    } catch (error) {
      console.error('Erro na pesquisa:', error);
      
      // Atualizar status da timeline com erro
      updateTimelineStatus('reddit', 'error', 'Falha na busca do Reddit');
      updateTimelineStatus('aggregate', 'error', 'Processo interrompido');
      updateTimelineStatus('ai', 'error', 'Processo interrompido');
      updateTimelineStatus('jikan', 'error', 'Processo interrompido');
      
      loadingIndicator.style.display = 'none';
      aiSummary.innerHTML = `
        <div class="alert alert-danger">
          <strong>Erro:</strong> ${error.message || 'Ocorreu um erro ao buscar dados do Reddit'}
        </div>
      `;
    } finally {
      // Esconder spinner
      searchSpinner.classList.add('d-none');
      searchButton.disabled = false;
    }
  }
  
  // Extrair gêneros para filtros
  function extractGenres(recommendations) {
    allGenres.clear();
    
    recommendations.forEach(rec => {
      if (rec.jikanInfo && rec.jikanInfo.genres) {
        rec.jikanInfo.genres.forEach(genre => {
          allGenres.add(genre);
        });
      }
      
      if (rec.jikanInfo && rec.jikanInfo.themes) {
        rec.jikanInfo.themes.forEach(theme => {
          allGenres.add(theme);
        });
      }
    });
    
    // Criar filtros de gênero
    createGenreFilters();
  }
  
  // Criar filtros de gênero
  function createGenreFilters() {
    genreFilters.innerHTML = '';
    
    if (allGenres.size === 0) {
      genreFilters.parentElement.style.display = 'none';
      return;
    }
    
    genreFilters.parentElement.style.display = 'block';
    
    // Adicionar filtro "Todos"
    const allFilter = document.createElement('span');
    allFilter.className = 'badge bg-secondary genre-filter active';
    allFilter.textContent = 'Todos';
    allFilter.dataset.genre = 'all';
    allFilter.addEventListener('click', () => toggleGenreFilter('all'));
    genreFilters.appendChild(allFilter);
    
    // Adicionar filtros para cada gênero
    Array.from(allGenres).sort().forEach(genre => {
      const badge = document.createElement('span');
      badge.className = 'badge bg-secondary genre-filter';
      badge.textContent = genre;
      badge.dataset.genre = genre;
      badge.addEventListener('click', () => toggleGenreFilter(genre));
      genreFilters.appendChild(badge);
    });
  }
  
  // Toggle filtro de gênero
  function toggleGenreFilter(genre) {
    const allFilters = document.querySelectorAll('.genre-filter');
    
    if (genre === 'all') {
      // Desativar todos os outros filtros
      allFilters.forEach(filter => {
        if (filter.dataset.genre === 'all') {
          filter.classList.add('active');
        } else {
          filter.classList.remove('active');
        }
      });
      
      activeFilters.genres = [];
    } else {
      // Desativar o filtro "Todos"
      const allFilter = document.querySelector('.genre-filter[data-genre="all"]');
      allFilter.classList.remove('active');
      
      // Toggle o filtro clicado
      const clickedFilter = document.querySelector(`.genre-filter[data-genre="${genre}"]`);
      clickedFilter.classList.toggle('active');
      
      // Atualizar filtros ativos
      if (clickedFilter.classList.contains('active')) {
        activeFilters.genres.push(genre);
      } else {
        activeFilters.genres = activeFilters.genres.filter(g => g !== genre);
      }
      
      // Se nenhum filtro estiver ativo, ativar "Todos"
      if (activeFilters.genres.length === 0) {
        allFilter.classList.add('active');
      }
    }
    
    // Aplicar filtros
    applyFilters();
  }
  
  // Resetar filtros
  function resetFilters() {
    activeFilters = {
      type: 'all',
      genres: []
    };
    
    // Resetar select de tipo
    if (filterSelect) {
      filterSelect.value = 'all';
    }
    
    // Limpar filtros de gênero
    genreFilters.innerHTML = '';
    genreFilters.parentElement.style.display = 'none';
    
    // Esconder botão de debug
    debugModeBtn.classList.add('d-none');
  }
  
  // Aplicar filtros
  function applyFilters() {
    if (!currentResults || !currentResults.summary || !currentResults.summary.recomendacoes) {
      return;
    }
    
    const recommendations = currentResults.summary.recomendacoes;
    const items = document.querySelectorAll('.recommendation-item');
    
    items.forEach((item, index) => {
      const rec = recommendations[index];
      let visible = true;
      
      // Filtrar por tipo
      if (activeFilters.type !== 'all' && rec.jikanInfo) {
        const type = rec.jikanInfo.type ? rec.jikanInfo.type.toLowerCase() : '';
        if (type !== activeFilters.type) {
          visible = false;
        }
      }
      
      // Filtrar por gênero
      if (visible && activeFilters.genres.length > 0 && rec.jikanInfo) {
        const recGenres = [
          ...(rec.jikanInfo.genres || []),
          ...(rec.jikanInfo.themes || [])
        ];
        
        // Verificar se pelo menos um dos gêneros selecionados está presente
        const hasMatchingGenre = activeFilters.genres.some(genre => 
          recGenres.includes(genre)
        );
        
        if (!hasMatchingGenre) {
          visible = false;
        }
      }
      
      // Aplicar visibilidade
      item.style.display = visible ? '' : 'none';
    });
  }
  
  // Exibir resultados da busca na tela de debug
  function displayDebugSearchResults(data) {
    if (!data.searchResults || data.searchResults.length === 0) {
      debugSearchResults.innerHTML = '<div class="alert alert-info">Nenhum resultado encontrado para este tema.</div>';
      return;
    }
    
    let html = `<p>Encontrados ${data.searchResults.length} posts relacionados a "${data.topic}" em r/${data.subreddit}</p>`;
    
    // Exibir posts encontrados
    html += '<div class="list-group">';
    data.searchResults.forEach(post => {
      const date = new Date(post.created).toLocaleDateString('pt-BR');
      
      html += `
        <div class="list-group-item">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">${post.title}</h5>
            <small>Score: ${post.score}</small>
          </div>
          <p class="mb-1">
            <small>Por u/${post.author} • ${date} • ${post.commentCount} comentários</small>
          </p>
          <small><a href="${post.url}" target="_blank" class="text-primary">Ver no Reddit <i class="fas fa-external-link-alt"></i></a></small>
        </div>
      `;
    });
    html += '</div>';
    
    debugSearchResults.innerHTML = html;
  }
  
  // Exibir dados do Jikan na tela de debug
  function displayDebugJikanData(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      debugJikanData.innerHTML = '<div class="alert alert-info">Nenhuma informação adicional disponível.</div>';
      return;
    }
    
    const enrichedRecs = recommendations.filter(rec => rec.jikanInfo);
    
    if (enrichedRecs.length === 0) {
      debugJikanData.innerHTML = '<div class="alert alert-info">Nenhuma informação adicional disponível.</div>';
      return;
    }
    
    let html = `<p>Dados adicionais para ${enrichedRecs.length} recomendações:</p>`;
    
    html += '<div class="accordion" id="jikanAccordion">';
    enrichedRecs.forEach((rec, index) => {
      html += `
        <div class="accordion-item">
          <h2 class="accordion-header" id="jikan-heading-${index}">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#jikan-collapse-${index}" aria-expanded="false" aria-controls="jikan-collapse-${index}">
              ${rec.jikanInfo.title_english || rec.titulo}
            </button>
          </h2>
          <div id="jikan-collapse-${index}" class="accordion-collapse collapse" aria-labelledby="jikan-heading-${index}" data-bs-parent="#jikanAccordion">
            <div class="accordion-body">
              <pre class="bg-light p-3 rounded">${JSON.stringify(rec.jikanInfo, null, 2)}</pre>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    debugJikanData.innerHTML = html;
  }

  // Exibir resumo da IA
  function displayAISummary(summary) {
    if (!summary || !summary.recomendacoes || summary.recomendacoes.length === 0) {
      loadingIndicator.style.display = 'none';
      aiSummary.innerHTML = '<div class="alert alert-info">Não foi possível encontrar recomendações nos comentários.</div>';
      return;
    }
    
    // Esconder o indicador de carregamento
    loadingIndicator.style.display = 'none';
    
    let html = '';
    summary.recomendacoes.forEach(rec => {
      // Verificar se temos informações do Jikan
      const hasJikanInfo = rec.jikanInfo && rec.jikanInfo.image_url;
      
      html += `
        <div class="recommendation-item ${hasJikanInfo ? 'with-jikan' : ''}">
          ${hasJikanInfo ? `
            <div class="recommendation-header">
              <div class="recommendation-image">
                <img src="${rec.jikanInfo.image_url}" alt="${rec.titulo}" class="img-fluid rounded">
              </div>
              <div class="recommendation-title-info">
                <div class="recommendation-point">${rec.jikanInfo.title_english || rec.titulo}</div>
                <div class="recommendation-japanese">${rec.jikanInfo.title_japanese || ''}</div>
                <div class="recommendation-meta">
                  ${rec.jikanInfo.type || ''} ${rec.jikanInfo.episodes ? `• ${rec.jikanInfo.episodes} episódios` : ''} 
                  ${rec.jikanInfo.year ? `• ${rec.jikanInfo.year}` : ''} 
                  ${rec.jikanInfo.status ? `• ${rec.jikanInfo.status}` : ''}
                </div>
                <div class="recommendation-score">
                  <i class="fas fa-star"></i> ${rec.jikanInfo.score || 'N/A'} 
                  ${rec.jikanInfo.scored_by ? `(${formatNumber(rec.jikanInfo.scored_by)} avaliações)` : ''}
                </div>
                <div class="recommendation-genres">
                  ${rec.jikanInfo.genres ? rec.jikanInfo.genres.map(genre => `<span class="badge bg-primary">${genre}</span>`).join(' ') : ''}
                  ${rec.jikanInfo.themes ? rec.jikanInfo.themes.map(theme => `<span class="badge bg-secondary">${theme}</span>`).join(' ') : ''}
                </div>
                ${rec.jikanInfo.studios ? `
                  <div class="recommendation-studios">
                    Studio: ${rec.jikanInfo.studios.join(', ')}
                  </div>
                ` : ''}
                ${rec.jikanInfo.url ? `
                  <div class="recommendation-links mt-2">
                    <a href="${rec.jikanInfo.url}" target="_blank" class="btn btn-sm btn-outline-primary">
                      <i class="fas fa-external-link-alt"></i> Ver Mais
                    </a>
                    ${rec.jikanInfo.trailer ? `
                      <a href="${rec.jikanInfo.trailer}" target="_blank" class="btn btn-sm btn-outline-danger">
                        <i class="fab fa-youtube"></i> Trailer
                      </a>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
            ${rec.jikanInfo.synopsis ? `
              <div class="recommendation-synopsis">
                <div class="synopsis-title">Sinopse:</div>
                <div class="synopsis-text">${rec.jikanInfo.synopsis}</div>
              </div>
            ` : ''}
          ` : `<div class="recommendation-point">${rec.titulo}</div>`}
          
          <div class="recommendation-explanation">
            <div class="motivos-title">Por que os usuários recomendam:</div>
            <ul class="motivos-list">
      `;
      
      if (rec.motivos && rec.motivos.length > 0) {
        rec.motivos.forEach(motivo => {
          html += `<li>${motivo}</li>`;
        });
      } else {
        html += `<li>Sem motivos específicos mencionados</li>`;
      }
      
      html += `
            </ul>
          </div>
        </div>
      `;
    });
    
    aiSummary.innerHTML = html;
  }

  // Formatar números grandes (ex: 1000 -> 1K)
  function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Copiar texto agregado na tela de debug
  function copyDebugAggregatedText() {
    const text = debugAggregatedText.textContent;
    navigator.clipboard.writeText(text)
      .then(() => {
        const originalText = debugCopyButton.textContent;
        debugCopyButton.textContent = 'Copiado!';
        setTimeout(() => {
          debugCopyButton.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Erro ao copiar texto:', err);
        alert('Não foi possível copiar o texto. Por favor, tente novamente.');
      });
  }

  // Event Listeners
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const topic = topicInput.value.trim();
    const subreddit = subredditSelect.value;
    
    if (topic) {
      searchReddit(topic, subreddit);
    }
  });
  
  // Alternar entre visualizações de grid e lista
  gridViewBtn.addEventListener('click', () => toggleView('grid'));
  listViewBtn.addEventListener('click', () => toggleView('list'));
  
  // Alternar entre telas principal e debug
  debugModeBtn.addEventListener('click', () => switchScreen('debug'));
  backToMainBtn.addEventListener('click', () => switchScreen('main'));
  
  // Copiar texto agregado na tela de debug
  debugCopyButton.addEventListener('click', copyDebugAggregatedText);
  
  // Filtrar por tipo
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      activeFilters.type = filterSelect.value;
      applyFilters();
    });
  }

  // Inicialização
  loadSubreddits();
  initTimeline();
  resetFilters();
}); 
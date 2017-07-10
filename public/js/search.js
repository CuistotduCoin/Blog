function searchIndex() {
    return lunr(function() {
        this.field("title",{boost:10}),
        this.field("categories",{boost:5}),
        this.ref("ref")
    });
}

function loadIndexJson(indexJsonLoadedFunction) {
    var x = new XMLHttpRequest;
    x.overrideMimeType("application/json");
    x.open("GET", "/public/index.json", true);
    x.onreadystatechange = function() {
        if (4 == x.readyState && "200" == x.status) {
            indexJsonLoadedFunction(
                JSON.parse(x.responseText)
            );
        }
    }
    r.send(null)
}

function addToSearchIndex(lunrIndex, indexLoadedFunction) {
  return function(index) {
    var titles = {};
    index.forEach(function(item) {
      lunrIndex.add(item);
      // The lunr results only contain ref and score
      // so we have to keep track of any other values
      // we want to display ourselves
      titles[item.ref] = item.title;
    }
    indexLoadedFunction(lunrIndex, titles);
  }
}

function search(renderFactoryFunction) {
    return function(lunrIndex, titles) {
        var renderFunction = renderFactoryFunction(titles);
        return function(query) {
            var results = lunrIndex.search(query);
            renderFunction(results);
        }
    }
}

function renderSearchResults(searchResultsNode) {
    return function(titles) {
        return function(results) {
            // Create a list of results
            var ul = document.createElement('ul');
            results.forEach(function(result) {
                var li = document.createElement('li');
                // Create an item with the title
                li.appendChild(document.createTextNode(
                    titles[result.ref]
                ));
                ul.appendChild(li);
            });
            // Remove any existing content
            while (searchResultsNode.hasChildNodes()) {
                searchResultsNode.removeChild(
                    searchResultsNode.lastChild
                );
            }
            // Render the list
            searchResultsNode.appendChild(ul);
        }
    }
}

function registerSearchHandler(searchInputNode, searchFactoryFunction) {
    return function(lunrIndex, titles) {
        var searchFunction = searchFactoryFunction(lunrIndex, titles);
        // Register an oninput event handler
        searchInputNode.oninput = function(event) {
            var query = event.target.value;
            searchFunction(query);
        }
    }
}

loadIndexJson(
    addToSearchIndex(
        searchIndex(),
        registerSearchHandler(
            document.getElementById('search-input'),
            search(
                renderSearchResults(
                    document.getElementById('search-results')
                )
            )
        )
    )
);

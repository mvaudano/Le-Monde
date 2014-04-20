var fJS;
jQuery(document).ready(function($) {

      
  $(function () {


     if($("#search_box").value == "") { 
        /*$(".revenir").css("display","none")*/
         }

    // Récupération des données avec Gselper

    var donnees = new Array();

    // Création de l'instance de Gselper
    var doc = new Gselper({
        // Identifiant du document
        key: "1-7Q3WCtCdw_ZOAGF_kFq0OVwwKSASyLeFWRqdJLII6E",
        // Le worksheet du document
        worksheet: "od6",

        // La fonction à appeler lorsque le document est chargé
        onComplete: function(data) {

            // Ici faites ce qu'il vous chante
            // Par exemple, afficher dans la console le contenu de la première case
            
            // Ou parcourir le document ligne après ligne
            $.each(doc.get(), function(i, line) {
                donnees.push(
                {
                  id: i,
                  ville: line.ville,
                  departement: line.departement,
                  longitude_auto: Number(line.longitudeauto),
                  latitude_auto: Number(line.latitudeauto),
                  longitude: Number(line.longitude),
                  latitude: Number(line.latitude),
                  maire: line.maire,
                  etiquette: line.etiquette,
                  lien1: line.lien1,
                  lien2: line.lien2,
                  lien3: line.lien3,
                  lien4: line.lien4,
                  titre1: line.titre1,
                  titre2: line.titre2,
                  titre3: line.titre3,
                  titre4: line.titre4            
                })
            });
            fJS = filterInit(donnees);
             
        }
    });
    
               
  });


     $('.outremer').click(function(e){
      e.preventDefault();
      valeur = $(this).data('value');
      googleMap.outreMer(valeur);
     });

});



function filterInit(donnees) {

  var view = function(donnee){
    googleMap.addMarker(donnee);

    html = "<li><span class=\"ville\">"+donnee.ville+"</span></li>";
   
    return html;
       
  };

  var filter_callbacks = {
    after_filter: function(result){

            if(result.length > 1) { 
              pluriel = "résultats" 
            } else { pluriel = "résultat"}
            $('#result_count').text(result.length + ' '+pluriel);
            if(result.length == 0) { // Si il n'y a pas de réponses
                $('#notule').html("<p class=\"aucunresultat tt5\" align=\"center\">Nous n'avons archivé aucun programme dans cette ville. Aidez-nous à compléter la base de données en soumettant un programme ci-dessus.</p>");
             }
     
      googleMap.updateMarkers(result,donnees);

      $.each(result, function(i, id){ // Ajout du recentrage au clic sur un rÃ©sultat de la liste
        identifiant = '#fjs_'+id;
        // ide = id-1;
          $(identifiant).click( function() {
            ide = id;                 
            $("#search_box").val(donnees[ide].ville);
            

            var notule = "<p class=\"tt3_capital\">"+donnees[ide].ville+" ("+donnees[ide].departement+")</p><p class=\"txt5\"><strong>Maire élu : "+donnees[ide].maire;
                    if(donnees[ide].etiquette) notule += " ("+donnees[ide].etiquette+")";
                    notule += "</strong></p>"
                    var liens = new Array([donnees[ide].lien1,donnees[ide].titre1],[donnees[ide].lien2,donnees[ide].titre2],[donnees[ide].lien3,donnees[ide].titre3],[donnees[ide].lien4,donnees[ide].titre4])
                    

                    
                      notule += "<ul class=\"liste_chevron lien_ancres txt5\">"
                       $.each(liens, function(i,value) {
                        var ii = i+1
                        if(liens[i][0]) notule += "<li><a href=\""+liens[i][0]+"\" target=\"_blank\">"+liens[i][1]+"</a></li>";
                       });
                        notule += "</ul>"

            $("#notule").html(notule)
            fJS.filter();
          });
      });



    }
  };

  var settings = {
    search: {input: '#search_box', search_in: '.ville, .nom', min_length: 1 },
    and_filter_on: false,
    callbacks: filter_callbacks, // Filter callback execute in filter init and each filtering event.
    id_field: 'id' //Default is id. This is only for usecase
  };

$('.filter_by_link').click(function(e){
      e.preventDefault();
      $($(this).data('target')).val($(this).data('value'));
      fJS.filter();
  });

$('#contribuer').click(function(e){
      e.preventDefault();
     $("#formulaire").css("display","block")
  });
$('#close').click(function(e){
      e.preventDefault();
     $("#formulaire").css("display","none")
  });



 googleMap.init();
 tailleIframe();


    return FilterJS(donnees, "#resultats", view, settings);

  
};

function tailleIframe()
{
  if (top.location != self.document.location)
    {
      $(window.parent.document).find('.embed').children('iframe').get(0).height=$('body').height()+20;
    }
}


var googleMap = {
        latlng: [46.9833,1.68333],
        zoom: 6,
        markers: {},
        map: null,
        

        init: function() {

                

                  var mapOptions = {
                    zoom: googleMap.zoom,
                    minZoom: 2,
                    maxZoom:12,
                    center: new google.maps.LatLng(this.latlng[0], this.latlng[1]),
                    mapTypeControlOptions: false,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    mapTypeControl: false,
                    draggable: true,
                    panControl: false,
                    scrollwheel: true,
                    zoomControl: true,
                    // zoomControlOptions: {
                    //   style: google.maps.ZoomControlStyle.SMALL
                    // },
                    streetViewControl: false,
                    disableDoubleClickZoom: false,
                    styles: [{"elementType":"labels.text","stylers":[{"visibility":"on"}]},{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"color":"#f5f5f2"},{"visibility":"on"}]},{"featureType":"administrative","stylers":[{"visibility":"on"}]},{"featureType":"transit","stylers":[{"visibility":"off"}]},{"featureType":"poi.attraction","stylers":[{"visibility":"off"}]},{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"visibility":"on"}]},{"featureType":"poi.business","stylers":[{"visibility":"off"}]},{"featureType":"poi.medical","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","stylers":[{"visibility":"off"}]},{"featureType":"poi.school","stylers":[{"visibility":"off"}]},{"featureType":"poi.sports_complex","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#ffffff"},{"visibility":"simplified"}]},{"featureType":"road.arterial","stylers":[{"visibility":"simplified"},{"color":"#ffffff"}]},{"featureType":"road.highway","elementType":"labels.icon","stylers":[{"color":"#ffffff"},{"visibility":"off"}]},{"featureType":"road.highway","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road.arterial","stylers":[{"color":"#ffffff"}]},{"featureType":"road.local","stylers":[{"color":"#ffffff"}]},{"featureType":"poi.park","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"color":"#71c8d4"}]},{"featureType":"landscape","stylers":[{"color":"#e5e8e7"}]},{"featureType":"poi.park","stylers":[{"color":"#8ba129"}]},{"featureType":"road","stylers":[{"color":"#ffffff"}]},{"featureType":"poi.sports_complex","elementType":"geometry","stylers":[{"color":"#c7c7c7"},{"visibility":"off"}]},{"featureType":"water","stylers":[{"color":"#a0d3d3"}]},{"featureType":"poi.park","stylers":[{"color":"#91b65d"}]},{"featureType":"poi.park","stylers":[{"gamma":1.51}]},{"featureType":"road.local","stylers":[{"visibility":"off"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"visibility":"on"}]},{"featureType":"poi.government","elementType":"geometry","stylers":[{"visibility":"off"}]},{"featureType":"landscape","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"visibility":"simplified"}]},{"featureType":"road.local","stylers":[{"visibility":"simplified"}]},{"featureType":"road"},{"featureType":"road"},{},{"featureType":"road.highway"}]
                  };
          this.map = new google.maps.Map(document.getElementById("carte"),mapOptions);

    },

    addMarker: function(donnee) {

           
                     if(donnee.latitude && donnee.longitude) {
                        var positionnement = new google.maps.LatLng(donnee.latitude,donnee.longitude);
                      }
                      else {
                        var positionnement = new google.maps.LatLng(donnee.latitude_auto,donnee.longitude_auto);
                      }
                  
                    var marker = new google.maps.Marker({
                      position: positionnement,
                      map: this.map,
                      title: donnee.ville,
                      icon: new google.maps.MarkerImage('img/orange.png')
                    });
                    

                    this.markers[donnee.id] = marker;



                    var notule = "<p class=\"tt3_capital\">"+donnee.ville+" ("+donnee.departement+")</p><p class=\"txt5\"><strong>Maire élu : "+donnee.maire;
                    if(donnee.etiquette) notule += " ("+donnee.etiquette+")";
                    notule += "</strong></p>"
                    var liens = new Array([donnee.lien1,donnee.titre1],[donnee.lien2,donnee.titre2],[donnee.lien3,donnee.titre3],[donnee.lien4,donnee.titre4])
                    

                    
                      notule += "<ul class=\"liste_chevron lien_ancres txt5\">"
                       $.each(liens, function(i,value) {
                        var ii = i+1
                        if(liens[i][0]) notule += "<li><a href=\""+liens[i][0]+"\" target=\"_blank\">"+liens[i][1]+"</a></li>";
                       });
                        notule += "</ul>"


                    var infowindow = new google.maps.InfoWindow({
                        content: "<div class=\"infofirefox\"><p align=\"center\" class=\"tt4_capital\">"+donnee.ville+"</p></div>",
                        pixelOffset: new google.maps.Size(0, -18)
                    });

                    google.maps.event.addListener(marker, 'mouseover', function() {
                      infowindow.open(this.map,marker);
                    });
                     google.maps.event.addListener(marker, 'mouseout', function() {
                      infowindow.close(this.map,marker);
                    });




                    google.maps.event.addListener(marker, 'mouseover', function() {
                        $("#fjs_"+donnee.id).addClass("selectionne");
                    });

                    google.maps.event.addListener(marker, 'mouseout', function() {
                    
                        $("#fjs_"+donnee.id).removeClass("selectionne");
                    });

                    google.maps.event.addListener(marker, 'click', function() {
                        $("#search_box").val(donnee.ville);
                        $("#notule").html(notule)
                        fJS.filter();
                    });
                   

                    $(".revenir").css("display","block")

                    return marker;
      },

      updateMarkers: function(filtering_result,donnees){
        
                      var google_map = this;
                      var bounds = new google.maps.LatLngBounds();
                      
                      this.map.setZoom(googleMap.zoom);
                      
                      $.each(google_map.markers, function(){ 
                        this.setMap(null);
                        
                         })
                      $.each(filtering_result, function(i, id){
   
                        loc = new google.maps.LatLng(google_map.markers[id].position.d,google_map.markers[id].position.e);
                        bounds.extend(loc);
                        
                        google_map.markers[id].setMap(google_map.map);
                      });

                      if(filtering_result.length) {
                          if(filtering_result.length == donnees.length) { // Si le champ de recherche est vide
                            google_map.reCentrer(); }
                          else { 
                            google_map.setCenterPoint(); 
                            this.map.fitBounds(bounds);
                            this.map.panToBounds(bounds);

                          }
                      }

                    
      },

      setCenterPoint: function(){
        var lat = 0, lng = 0; count = 0;

        //Calculate approximate center point.
        for(id in this.markers){
          var m = this.markers[id];

          if(m.map){
            lat += m.getPosition().lat();
            lng += m.getPosition().lng();
            count++;
          }

        }
        

        if(count > 0){
          if(count == 1) { 
            this.map.setZoom(9);
           } else { this.map.setZoom(googleMap.zoom) }
          this.map.setCenter(new google.maps.LatLng(lat/count,lng/count));
        }
      },

      reCentrer: function(){
        this.map.setCenter(new google.maps.LatLng(googleMap.latlng[0],googleMap.latlng[1]));

      },

      outreMer: function(valeur){

        this.map.setCenter(new google.maps.LatLng(valeur[0],valeur[1]));
        this.map.setZoom(valeur[2]);
      }


  }

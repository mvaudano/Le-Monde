/*jslint nomen:false, debug:true, evil:true, vars:false, browser:true, forin:true, undef:false, white:false */
/**
 * JotForm Form object
 */
var JotForm = {
    /**
     * JotForm domain
     * @var String
     */
    url: "//www.jotform.com/", // Will get the correct URL from this.getServerURL() method
    /**
     * JotForm request server location
     * @var String
     */
    server: "//www.jotform.com/server.php", // Will get the correct URL from this.getServerURL() method
    /**
     * All conditions defined on the form
     * @var Object
     */
    conditions: {},
    /**
     * All calculations defined on the form
     * @var Object
     */
    calculations: {},
    /**
     * Condition Values
     * @var Object
     */
    condValues: {},
    /**
     * Progress bar object above form
     * @var Object
     */
    progressBar: false,    
    /**
     * All JotForm forms on the page
     * @var Array
     */
    forms: [],
    /**
     * Will this form be saved on page changes
     * @var Boolean
     */
    saveForm: false,
    /**
     * Array of extensions
     * @var Array
     */
    imageFiles: ["png", "jpg", "jpeg", "ico", "tiff", "bmp", "gif", "apng", "jp2", "jfif"],
    /**
     * array of autocomplete elements
     * @var Object
     */
    autoCompletes: {},
    /**
     * Array of default values associated with element IDs
     * @var Object
     */
    defaultValues: {},
    /**
     * Debug mode
     * @var Boolean
     */
    debug: false,
    /**
     * Check if the focused inputs must be highligted or not
     * @var Boolean
     */
    highlightInputs: true,
    /**
     * it will disable the automatic jump to top on form collapse
     * @var Boolean
     */
    noJump: false,
    /**
     * Indicates that form is still under initialization
     * @var Boolean
     */
    initializing: true,
    /**
     * Keeps the last focused input
     * @var Boolean
     */
    lastFocus: false,
    /**
     * Status of multipage save
     * @var Boolean
     */
    saving: false,
    /**
     * Texts used in the form
     * @var Object
     */
    texts: {
        confirmEmail:       'E-mail does not match',
        pleaseWait:         'Please wait...',
        confirmClearForm:   'Are you sure you want to clear the form',
        lessThan:           'Your score should be less than or equal to',
        incompleteFields:   'There are incomplete required fields. Please complete them.',
        required:           'This field is required.',
        requireOne:         'At least one field required.', 
        requireEveryRow:    'Every row is required.',
        email:              'Enter a valid e-mail address',
        alphabetic:         'This field can only contain letters',
        numeric:            'This field can only contain numeric values',
        alphanumeric:       'This field can only contain letters and numbers.',
        url:                'This field can only contain a valid URL',
        uploadExtensions:   'You can only upload following files:',
        uploadFilesize:     'File size cannot be bigger than:',
        gradingScoreError:  'Score total should only be less than or equal to',
        inputCarretErrorA:  'Input should not less than the minimum value:',
        inputCarretErrorB:  'Input should not greater than the maximum value:',
        maxDigitsError:     'The maximum digits allowed is',
        freeEmailError:     'Free email accounts are not allowed',
        minSelectionsError: 'The minimum required number of selections is ',
        maxSelectionsError: 'The maximum number of selections allowed is ',
        pastDatesDisallowed:'Date must not be in the past.',
        generalError:       'There are errors on the form. Please fix them before continuing.',
        generalPageError:   'There are errors on this page. Please fix them before continuing.'
    },
    /**
     * Find the correct server url from forms action url, if there is no form use the defaults
     */
    getServerURL: function() {
        var form = $$('.jotform-form')[0];
        var action;
        
        if (form) {
            if((action = form.readAttribute('action'))){
                if(action.include('submit.php') || action.include('server.php')){
                    var n = !action.include('server.php')? "submit" : "server";
                    this.server = action.replace(n+'.php', 'server.php');
                    this.url    = action.replace(n+'.php', '');
                }else{
                    var d = action.replace(/\/submit\/.*?$/, '/');
                    this.server = d + 'server.php';
                    this.url    = d;
                }
                
            }
        }
    },
    /**
     * Changes only the given texsts
     * @param {Object} newTexts
     */
    alterTexts: function(newTexts){
        Object.extend(this.texts, newTexts || {});
    },
    /**
     * A short snippet for detecting versions of IE in JavaScript
     * without resorting to user-agent sniffing
     */
    ie: function(){
        var undef,
            v = 3,
            div = document.createElement('div'),
            all = div.getElementsByTagName('i');
        
        while (
            div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
            all[0]
        );
        
        return v > 4 ? v : undef;
    },
    /**
     * Creates the console arguments
     */
    createConsole: function(){
        var consoleFunc = ['log', 'info', 'warn', 'error'];
        $A(consoleFunc).each(function(c){
            this[c] = function(){
                if(JotForm.debug){
                    if('console' in window){
                        try{
                            console[c].apply(this, arguments);
                        }catch(e){
                            if(typeof arguments[0] == "string"){
                                console.log( c.toUpperCase() + ": " + $A(arguments).join(', '));
                            }else{
                                if(Prototype.Browser.IE){
                                    alert(c+": "+arguments[0]);
                                }else{
                                    console[c](arguments[0]);
                                }
                            }
                        }
                    }
                }
            };
        }.bind(this));
        
        if(JotForm.debug){
            JotForm.debugOptions = document.readJsonCookie('debug_options');
        }
    },
    /**
     * Initiates the form and all actions
     */
    init: function(callback){
        var ready = function(){
            try {
                this.populateGet();
                
                if(document.get.debug == "1"){
                    this.debug = true;
                }
                this.createConsole();
                
                this.getServerURL();
                
                if(callback){ callback(); }
                
                if ((document.get.mode == "edit" || document.get.mode == "inlineEdit" || document.get.mode == 'submissionToPDF') && document.get.sid) {
                    this.editMode();
                }
                
                this.noJump = ("nojump" in document.get);                
                this.uniqueID = this.uniqid();
                this.checkMultipleUploads();
                this.handleSavedForm();
                this.setTitle();
                this.getDefaults();
                this.handlePayPalProMethods();
                // If coupon button exists, load checkCoupon
                if($('coupon-button')) {
                    this.checkCoupon();
                }
                
                this.handleFormCollapse();
                this.handlePages();
                
                if ( $$('.form-product-has-subproducts').length > 0 ) {
                    this.handlePaymentSubProducts();
                }

				// If form is hosted in an iframe, calculate the iframe height
				if (window.parent && window.parent != window) {
					this.handleIFrameHeight();
				}

                this.highLightLines();
                this.setButtonActions();
                this.initGradingInputs();
                this.initSpinnerInputs();
                this.initNumberInputs();
                this.setConditionEvents();
                this.setCalculationEvents();
                this.runCalculationsOnLoad();
                this.setCalculationResultReadOnly();
                this.prePopulations();
                this.handleAutoCompletes();
                this.handleTextareaLimits();
                this.handleDateTimeChecks();
                this.handleOtherOptions(); // renamed from handleRadioButtons
                this.setFocusEvents();
                this.disableAcceptonChrome();
                this.handleScreenshot();
                
                $A(document.forms).each(function(form){
                    if (form.name == "form_" + form.id || form.name == "q_form_" + form.id) {
                        this.forms.push(form);
                    }
                }.bind(this));

                var hasCaptcha = $$('div[id^=recaptcha_input]').length;

                if (!hasCaptcha || $$('*[class*="validate"]').length > hasCaptcha) {
                    this.validator();
                };

                this.fixIESubmitURL();
                this.disableHTML5FormValidation();
                
                if($('progressBar')) {
                    this.setupProgressBar();
                }
            } catch (err) {
                 JotForm.error(err);
            }

            this.initializing = false; // Initialization is over
        }.bind(this);
        
        if(document.readyState == 'complete' || (this.jsForm && document.readyState === undefined) ){
            ready();
        }else{
            document.ready(ready);
        }
    },
    handleIFrameHeight: function () {
    	var height;
    	if ($$('.form-collapse-table').length > 0) {
    		height = $$('body')[0].getHeight();
    	} else if ($$('.form-section').length > 1) {
    		var maxHeight = 0;
			var body = $$('body')[0];
    		var sections = $$('.form-section');

    		// First hide all the pages
    		sections.each(function(section) {
    			section.setStyle({display: 'none'});
    		}); 
			
			// Dislay each page sequentially, and find the body height
    		sections.each(function(section) {
    			section.setStyle({display: 'block'});
    			if (maxHeight < body.getHeight()) {
    				maxHeight = body.getHeight();
    			}
				section.setStyle({display: 'none'});
    		});

			// Display the first page
    		sections[0].setStyle({display: 'block'});
    		height = maxHeight;
    	} else {
    		height = $$('body').first().getHeight();
    	}

	// if this is a captcha verification page, set height to 300 
	height = ( document.title === 'Please Complete' ) ? 300 : height;
    	window.parent.postMessage('setHeight:' + height, '*');
    },
    fixIESubmitURL: function () {
        try{
            // IE on XP does not support TLS SSL 
            // http://en.wikipedia.org/wiki/Server_Name_Indication#Support
            if(this.ie() <= 8 && navigator.appVersion.indexOf('NT 5.')){
                $A(this.forms).each(function(form){
                    if(form.action.include("s://submit.")){
                       form.action = form.action.replace(/\/\/submit\..*?\//, "//secure.jotform.com/"); 
                    }
                });
            }
        }catch(e){}
    },
    screenshot  : false, // Cached version of screenshot
    passive     : false, // States if wishbox iis getting screenshot passively
    onprogress  : false, // Are we currently processing a screenshot?
    compact     : false, // Use the compact mode of the editor
    imageSaved  : false, // Check if the image saved by screenshot editor
    /**
     * Find screenshot buttons and set events
     * HIDE or SHOW according to the environment
     */
    handleScreenshot: function(){
        var $this = this;
        setTimeout(function(){
            $$('.form-screen-button').each(function(button){
                //$this.getContainer(button).hide();
                // If window parent has feedback then show screenshot
                if(window.parent && window.parent.JotformFeedbackManager){
                    $this.getContainer(button).show();                
                    button.observe('click', function(){
                        $this.passive = false;
                        try{
                            $this.takeScreenShot(button.id.replace('button_', ''));
                        }catch(e){
                            console.error(e);
                        }
                    });
                    setTimeout(function(){
                        $this.passive = !window.parent.wishboxInstantLoad;
                        $this.takeScreenShot(button.id.replace('button_', ''));
                    }, 0);
                }
            });
        }, 300);
    },
    getCharset: function(doc){    
        if(!doc){ doc = document; }
        
        return doc.characterSet || doc.defaultCharset || doc.charset || 'UTF-8';
    },
    /**
     * Convert number of bytes into human readable format
     *
     * @param integer bytes     Number of bytes to convert
     * @param integer precision Number of digits after the decimal separator
     * @return string
     */
    bytesToSize: function(bytes, precision) {
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        var posttxt = 0;
        if (bytes == 0) return 'n/a';
        if (bytes < 1024) { return Number(bytes) + " " + sizes[posttxt]; }
        while( bytes >= 1024 ) {
            posttxt++;
            bytes = bytes / 1024;
        }
        return bytes.toFixed(precision || 2) + " " + sizes[posttxt];
    },
    /*
    * Disables HTML5 validation for stopping browsers to stop submission process
    * (fixes bug of pending submissions when jotform validator accepts email field
    * and browsers' own validator doesn't ) 
    */
    disableHTML5FormValidation: function(){
        $$("form").each(function(f){
            f.setAttribute("novalidate",true);
        });
    },
    /**
     * When button clicked take the screenshot and display it in the editor
     */
    takeScreenShot: function(id){
        var p = window.parent;          // parent window
        var pleaseWait = '<div id="js_loading" '+
                         'style="position:fixed; z-index:10000000; text-align:center; '+
                         'background:#333; border-radius:5px; top: 20px; right: 20px; '+
                         'padding:10px; box-shadow:0 0 5 rgba(0,0,0,0.5);">'+
                         '<img src="'+this.url+'images/loader-black.gif" />'+
                         '<div style="font-family:verdana; font-size:12px;color:#fff;">'+
                         'Please Wait'+
                         '</div></div>';
                         
        if(this.onprogress){
            p.$jot(pleaseWait).appendTo('body');
            return;
        }
        
        if(p.wishboxCompactLoad){
            this.compact = true;
        }
        
        if(this.screenshot){
            if(this.compact){
                p.$jot('.jt-dimmer').hide();
            }else{
                p.$jot('.jt-dimmer, .jotform-feedback-link, .jt-feedback').hide();
            }
            
            p.jotformScreenshotURL = this.screenshot.data;
            this.injectEditor(this.screenshot.data, this.screenshot.shotURL);
            return;
        }
        
        this.scuniq = JotForm.uniqid(); // Unique ID to be used in the screenshot
        this.scID   = id;               // Field if which we will place the screen shot in
        var f = JotForm.getForm($('button_'+this.scID));
        this.sformID = f.formID.value;
        this.onprogress = true;
        var $this   = this;             // Cache the scope
        //this.wishboxServer = '//ec2-107-22-70-25.compute-1.amazonaws.com/wishbox-bot.php'; 
        this.wishboxServer = 'http://screenshots.jotform.com/wishbox-server.php'; //kemal: made this http since https not working anyway
        //this.wishboxServer = "//beta23.jotform.com/server.php";//JotForm.server;
        // Create a form element to make a hidden post. We need this to overcome xDomain Ajax restrictions
        var form = new Element('form', {action:this.wishboxServer, target:'screen_frame', id:'screen_form', method:'post', "accept-charset":'utf-8'}).hide();
        // Create a syntethic doctype for page source. This is the most common doctype so I choose this
        var doc  = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" >';
        // Hide Jotform specific page element on the parent, so they do not appear on screenshot
        
        /*if(this.compact){
            p.$jot('.jt-dimmer').hide();
        }else{*/
            p.$jot('.jt-dimmer, .jotform-feedback-link, .jt-feedback').hide();
        //}
        
        p.$jot('.hide-on-screenshot, .hide-on-screenshot *').css({'visibility':'hidden'});
        // Read the source of parent window
        var parentSource = p.document.getElementsByTagName('html')[0].innerHTML;
        parentSource = parentSource.replace(/(<noscript\b[^>]*>.*?<\/noscript>)+/gim, '');         // remove single line tags
        parentSource = parentSource.replace(/(<noscript\b[^>]*>(\s+.*\s+)+)+<\/noscript>/gim, ''); // remove multi line tags
        p.$jot('.hide-on-screenshot, .hide-on-screenshot *').css({'visibility':'visible'});
        parentSource = parentSource.replace(/(\<\/head\>)/gim, "<style>body,html{ min-height: 800px; }</style>$1");
        var ie = $this.ie();     
        // When it's the broken IE use a totally different aproach but IE9 works correctly so skip it
        if(ie !== undefined && ie < 9){
            parentSource = parentSource.replace(/(\<\/head\>)/gim, "<style>*{ border-radius:0 !important; text-shadow:none !important; box-shadow:none !important; }</style>$1");
        }

        if(this.passive){
            p.$jot('.jt-dimmer, .jotform-feedback-link, .jt-feedback').show();
        }else{
            p.$jot('.jotform-feedback-link').show();
            p.$jot(pleaseWait).appendTo('body');
        }
          
        // create form elements and place the values respectively
        var html  = new Element('textarea', {name:'html'});
        
        var nozip = this.getCharset(p.document).toLowerCase() !== 'utf-8';
        
        if(nozip){
            html.value    = encodeURIComponent(doc+parentSource+"</html>");
            form.insert(new Element('input', {type:'hidden', name:'nozip'}).putValue("1"));
        }else{
            form.insert(new Element('input', {type:'hidden', name:'nozip'}).putValue("0"));
            html.value    = encodeURIComponent(p.$jot.jSEND((doc+parentSource+"</html>")));
        }
        var charset   = new Element('input', {type:'hidden', name:'charset'}).putValue(this.getCharset(p.document));
        var height    = new Element('input', {type:'hidden', name:'height'}).putValue(parseFloat(p.$jot(p).height()));
        var scrollTop = new Element('input', {type:'hidden', name:'scrollTop'}).putValue(p.$jot(p).scrollTop());
        var url       = new Element('input', {type:'hidden', name:'url'}).putValue(p.location.href);
        var uid       = new Element('input', {type:'hidden', name:'uniqID'}).putValue(this.scuniq);
        var fid       = new Element('input', {type:'hidden', name:'formID'}).putValue(this.sformID);
        var action    = new Element('input', {type:'hidden', name:'action'}).putValue("getScreenshot");
        // This is the iframe that we will submit the form into
        var iframe    = new Element('iframe', {name:'screen_frame', id:'screen_frame_id'}).hide();
        // When iframe is loaded it usually means screenshot is completed but we still need to make sure.
        iframe.observe('load', function(){
            // Let's check server if screenshot correctly created there
            $this.checkScreenShot();
        });
        
        if(p.wishboxInstantLoad && (ie === undefined || ie > 8)){
            this.injectEditor(false, false);
        }
        
        // Insert all created elements on the page and directly submit the form
        form.insert(html).insert(height).insert(scrollTop).insert(action).insert(uid).insert(url).insert(fid).insert(charset);
        $(document.body).insert(form).insert(iframe);
        form.submit();
    },
    /**
     * Send a request to server and asks if given screenshot is created
     */
    checkScreenShot: function(){
        var $this = this;
        var p = window.parent;
        var count = 10; // will try 10 times after that it will fail
        
        p.$jot.getJSON('http://screenshots.jotform.com/queue/'+this.scuniq+'?callback=?',
            function(data) {
                if(data.success === true){
                    p.$jot.getJSON(data.dataURL+'?callback=?', function(res){
                        if($this.passive === false){
                            p.jotformScreenshotURL = res.data;
                            $this.injectEditor(res.data, res.shotURL); // If screenshot is created inject the editor on the page
                        }
                        $this.screenshot = res;
                        $this.onprogress = false;
                        // Remove the form and iframe since we don't need them anymore
                        $('screen_form') && $('screen_form').remove();
                        $('screen_frame_id') && $('screen_frame_id').remove();
                    });
                }else{
                    if((data.status == 'waiting' || data.status == 'working') && --count){
                        setTimeout(function(){
                            $this.checkScreenShot(); // If not try again. {TODO: We need to limit this check}
                        }, 1000);
                    }else{
                        alert('We are under heavy load right now. Please try again later.');
                        p.$jot('.jt-dimmer, .jotform-feedback-link').show();
                        p.$jot('.jt-feedback').show('slow');
                    }
                }
            }
        );
    },
    /**
     * Injects the screenshot editor on the page and sets necessery functions for editor to use
     */
    injectEditor: function(data, url){
        
        if(this.injected){
            return;
        }
        
        this.injected = true;
        var $this = this;
        var p     = window.parent;
        p.$jot('#js_loading').remove();
        
        // Ask for editor template code
        p.$jot.getJSON(this.server+'?callback=?', {
                action : 'getScreenEditorTemplate',
                compact: this.compact
            },
            function(res) {
                var iff  = '<iframe allowtransparency="true" id="wishbox-frame" src="" '+
                           'frameborder="0" style="display:none;border:none; ';
                    if(!$this.compact){
                        iff += 'position:fixed;top:0;width:100%;height:100%;left:0;z-index:100000000;';
                    }else{
                        iff += ('position:absolute;left:0;top:10px;height:'+(p.$jot(p).height()-120)+'px;width:'+((p.$jot(p).width()-100)-p.$jot('#js-form-content').width())+'px;');
                    }
                    iff += '" scrolling="no"></iframe>';
                var editorFrame;
                
                p.iframeWidth = ((p.$jot(p).width()-100)-p.$jot('#js-form-content').width());
                p.iframeHeight = (p.$jot(p).height()-120);
                
                // create an empty iframe on the page, we will then write the contents of this iframe manually
                if($this.compact){
                    editorFrame = p.$jot(iff).insertBefore('#js-form-content');
                }else{
                    editorFrame = p.$jot(iff).appendTo('body');
                }
                
                if($this.compact){
                    p.$jot('#js-form-content').css({  // when compact
                        'float':'right'
                    });
                }
                var ie = $this.ie();
                
                // When it's the broken IE use a totally different aproach but IE9 works correctly so skip it
                if(ie !== undefined && ie < 9){
                    // Set src for iframe inseat of writing the editor template in it.
                    editorFrame.attr('src', 'http://screenshots.jotform.com/opt/templates/screen_editor.html?shot='+url+'&uniq='+$this.scuniq);
                    // Put a close button outside of the iframe
                    var b = p.$jot('<button style="color:#fff;font-size:14px;background:#F59202;border:1px solid #Fa98a2;font-weight:bold;position:fixed;top:5px;right:40px;width:100px;z-index:100000001;">Close Editor</button>').appendTo('body');
                    // When close button clicked go fetch the saved image, if image is not saved then ask user are they sure?
                    b.click(function(){
                        
                        p.$jot.getJSON('http://screenshots.jotform.com/wishbox-server.php?callback=?', {
                            action: 'getImage',
                            uniqID: $this.scuniq
                        },function(res){
                            if(!res.success){
                                if(confirm('You haven\'t save your edits. Are you sure you want to close the editor?')){
                                    closeFrame();
                                    b.remove();
                                }
                            }else{
                                closeFrame();
                                b.remove();
                                
                                putImageOnForm(res.data, res.shotURL);
                            }
                        });
                    });
                }else{
                    // Write retrieved editor template into newly created iframe
                    var e = editorFrame[0];
                    var frameDocument = (e.contentWindow) ? e.contentWindow : (e.contentDocument.document) ? e.contentDocument.document : e.contentDocument;
                    frameDocument.document.open();
                    frameDocument.document.write(res.template);
                    setTimeout(function(){ frameDocument.document.close(); }, 200);
                    
                    // Cache the screenshot URL on parent window so editor can find it
                    p.jotformScreenshotURL = data;
                }
                
                // Closes the frame and removes all trace behind it
                var closeFrame = function(){
                    if($this.compact){
                        editorFrame.remove();
                        p.$jot('#js-form-content').css('width', '100%');
//                        p.$jot('.jt-content, .jt-title').css('width', 'auto');
                    }else{
                        editorFrame.hide('slow', function(){
                            editorFrame.remove();
                        });
                    }
                    $this.injected = false;
                    p.$jot('.jt-dimmer, .jotform-feedback-link').show();
                    p.$jot('.jt-feedback').show('slow');
                };
                
                // When image saved. Places it on the form
                var putImageOnForm = function(image, url){
                   // if(!$this.compact){
                        $('screen_'+$this.scID).update('<img width="100%" align="center" src="'+(url? url : image)+'" />');
                        $('data_'+$this.scID).value = image;
                        $('screen_'+$this.scID).up().show();
                   // }
                };
                
                // Cancel  and close the editor
                p.JotformCancelEditor = function(){
                    closeFrame();
                };
                
                // When editing completed retrive the edited screenshot code and place it on the form
                p.JotformFinishEditing = function(image){
                    closeFrame();
                    putImageOnForm(image);
                    $this.imageSaved = true;
                    if($this.compact){
                        setTimeout(function(){
                            $(document).fire('image:loaded');
                        }, 100);
                    }
                };
            }
        );
    },
    
    /**
     * Will get additional URL queries from SCRIPT embed or feedback widget
     */
    populateGet: function(){
        try{
            if('FrameBuilder' in window.parent && "get" in window.parent.FrameBuilder && window.parent.FrameBuilder.get != []){

                var outVals = {};
                var getVals = window.parent.FrameBuilder.get;
                $H(getVals).each(function(pair) {
                    if(typeof pair[1] === 'object') {
                        for(prop in pair[1]) {
                            outVals[pair[0] + "[" + prop + "]"] = pair[1][prop];
                        }
                    } else {
                        outVals[pair[0]] = pair[1];
                    }


                });
                document.get = Object.extend(document.get, outVals);
            }
        }catch(e){}
    },
    
    /**
     * Check if there are any multiple upload field. if any load multiple upload script
     */
    checkMultipleUploads: function(){
        if($$('.form-upload-multiple').length > 0){
            var script = document.createElement('script');
            script.type="text/javascript";
            script.src = "https://static-interlogyllc.netdna-ssl.com/file-uploader/fileuploader.js";
            $(document.body).appendChild(script);
        }
    },
    /**
     * Php.js uniqueID generator
     * @param {Object} prefix
     * @param {Object} more_entropy
     */
    uniqid: function(prefix, more_entropy){
        if (typeof prefix == 'undefined') { prefix = ""; }
        var retId;
        var formatSeed = function(seed, reqWidth){
            seed = parseInt(seed, 10).toString(16); // to hex str
            if (reqWidth < seed.length) { return seed.slice(seed.length - reqWidth); }
            if (reqWidth > seed.length) { return Array(1 + (reqWidth - seed.length)).join('0') + seed; }
            return seed;
        };
        if (!this.php_js) { this.php_js = {}; }
        if (!this.php_js.uniqidSeed) { this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15); }
        this.php_js.uniqidSeed++;
        retId = prefix;
        retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
        retId += formatSeed(this.php_js.uniqidSeed, 5);
        if (more_entropy) { retId += (Math.random() * 10).toFixed(8).toString(); }
        return retId;
    },

    /**
     * Initiates multiple upload scripts
     */
    initMultipleUploads: function(){

        var self = this;

        $$('.form-upload-multiple').each(function(file){
            var parent = file.up('div'); 
            var f = JotForm.getForm(file);
            var formID = f.formID.value;
            var uniq = formID+"_"+JotForm.uniqueID;
            
            // Handle default validations. reuired field
            var className = file.className;
            if(className.include("validate[required]")){
                parent.addClassName("validate[required]");
                parent.validateInput = function(){
                    // Don't fire validations for hidden elements
                    if(!JotForm.isVisible(parent)){ 
                        JotForm.corrected(parent);
                        return true; 
                    }
                    if(parent.select('.qq-upload-list li').length < 1){
                        JotForm.errored(parent, JotForm.texts.required);
                        return false;
                    }else{
                        JotForm.corrected(parent);
                        return true;
                    }
                };
            }
            
            // Create temp upload folder key 
            var hidden = new Element('input', {type:'hidden', name:'temp_upload_folder'}).setValue(uniq);
            f.insert({top:hidden});
            
            // Handle limited extensions
            var exts = (file.readAttribute('file-accept') || "").strip();
            exts = (exts !== '*')? exts.split(', ') : [];
            
            // Handle sublabels
            var n, subLabel ="";
            if((n = file.next()) && n.hasClassName('form-sub-label')){ subLabel = n.innerHTML; }
            
            //Emre: to make editing "text of multifile upload button" possible (33318)
            var m,buttonText;
            if(m = file.previous('.qq-uploader-buttonText-value')){ buttonText = m.innerHTML; }
            if(!buttonText){ buttonText = "Upload a File"; };

            // Initiate ajax uploader
            var uploader = new qq.FileUploader({
                debug: JotForm.debug,
                element: parent,
                action: JotForm.server,
                subLabel: subLabel,
                buttonText: buttonText,
                sizeLimit: parseInt(file.readAttribute('file-maxsize'), 10) * 1024, // Set file size limit
                allowedExtensions: exts,
                messages: {
                   typeError: self.texts.multipleFileUploads_typeError,
                   sizeError: self.texts.multipleFileUploads_sizeError,
                   minSizeError: self.texts.multipleFileUploads_minSizeError,
                   emptyError: self.texts.multipleFileUploads_emptyError,
                   onLeave: self.texts.multipleFileUploads_onLeave         
                },
                onComplete: function(id, aa, result){
                    if(result.success){
                        // This is needed for validations.
                        // removes reuired message
                        parent.value="uploaded";
                        JotForm.corrected(parent);
                    }
                },
                showMessage: function(message){
                    // Display errors in JotForm's way
                    JotForm.errored(parent, message);
                    setTimeout(function(){
                        // JotForm.corrected(parent);
                    }, 3000);
                },
                params: {
                    action: 'multipleUpload',
                    field: file.name.replace('[]', ''),
                    folder: uniq
                }
            });
        });
    },
    
    /**
     * Hiddenly submits the form on backend
     */
    hiddenSubmit: function(frm){
        if(JotForm.currentSection){
            JotForm.currentSection.select('.form-pagebreak')[0].insert(
                new Element('div', {className:'form-saving-indicator'})
                    .setStyle('float:right;padding:21px 12px 10px')
                    .update('<img src="'+JotForm.url+'images/ajax-loader.gif" align="absmiddle" /> Saving...')
            );
        }
        
        /**
         * Wait just a little to set saving status. 
         * We need this because of the back button hack for last page. 
         * Last page back button has two click events they both should work 
         * but saving status prevents second one to be working
         */
        setTimeout(function(){ JotForm.saving = true; }, 10);
        
        if(!$('hidden_submit_form')){
            var iframe = new Element('iframe', {name:'hidden_submit', id:'hidden_submit_form'}).hide();
            iframe.observe('load', function(){
                JotForm.makeUploadChecks();
                $$('.form-saving-indicator').invoke('remove');
                JotForm.saving = false;
            });
            $(document.body).insert(iframe);
        }
        $('current_page').value = JotForm.currentSection.pagesIndex;
        frm.writeAttribute('target', 'hidden_submit');
        frm.insert({
            top: new Element('input', {
                type: 'hidden',
                name: 'hidden_submission',
                id:   'hidden_submission'
            }).putValue("1")
        });
        
        frm.submit();
        frm.writeAttribute('target', '');
        $('hidden_submission').remove();
    },
    /**
     * Checks the upload fields after hidden submission
     * If they are completed, then makes them empty to prevent
     * Multiple upload of the same file
     */
    makeUploadChecks: function(){
        var formIDField = $$('input[name="formID"]')[0];
        var a = new Ajax.Jsonp(JotForm.url+'server.php', {
            parameters: {
                action: 'getSavedUploadResults',
                formID: formIDField.value,
                sessionID: document.get.session
            },
            evalJSON: 'force',
            onComplete: function(t){
                var res = t.responseJSON;
                if (res.success) {                    
                    if(res.submissionID && !$('submission_id')){
                        formIDField.insert({
                            after: new Element('input', {
                                type: 'hidden',
                                name: 'submission_id',
                                id:   'submission_id'
                            }).putValue(res.submissionID)
                        });                        
                    }
                    JotForm.editMode(res, true); // Don't reset fields
                }
            }
        });
    },
    /**
     * Handles the form being saved stuation
     */
    handleSavedForm: function(){
        
        if(!('session' in document.get)){
            return;
        }
        JotForm.saveForm = true;
        
        var formIDField = $$('input[name="formID"]')[0];
        
        formIDField.insert({
            after: new Element('input', {
                type: 'hidden',
                name: 'session_id',
                id:  "session"
            }).putValue(document.get.session)
        });
        
        formIDField.insert({
            after: new Element('input', {
                type: 'hidden',
                id:'current_page',
                name: 'current_page'
            }).putValue(0)
        });
        
        var a = new Ajax.Jsonp(JotForm.url+'server.php', {
            parameters: {
                action: 'getSavedSubmissionResults',
                formID: formIDField.value,
                sessionID: document.get.session,
                URLparams: window.location.href
            },
            evalJSON: 'force',
            onComplete: function(t){
                var res = t.responseJSON;
                if (res.success) {
                    if(res.submissionID){
                        formIDField.insert({
                            after: new Element('input', {
                                type: 'hidden',
                                name: 'submission_id',
                                id:   'submission_id'
                            }).putValue(res.submissionID)
                        });    

                        try{
                            JotForm.editMode(res);
                        }catch(e){
                            console.error(e);
                        }
                        JotForm.openInitially = res.currentPage - 1;                    
                    }
                    
                }
            }
        });
    },
    /**
     * Place the form title on pages title to remove the Form text on there
     */
    setTitle: function(){
        // Do this only when page title is form. otherwise it can overwrite the users own title
        if(document.title == "Form"){
            var head;
            if((head = $$('.form-header')[0])){
                try{
                    document.title = head.innerHTML.stripTags().strip();
                    document.title = document.title.unescapeHTML();
                }catch(e){
                    document.title = head.innerHTML;
                }
            }
        }
    },
    
    /**
     * Sets the last focus event to keep latest focused element
     */
    setFocusEvents: function(){
        $$('.form-radio, .form-checkbox').each(function(input){ //Neil: use mousedown event for radio & checkbox (Webkit bug:181934)
            input.observe('mousedown', function(){
                JotForm.lastFocus = input;
            })  
        });
        $$('.form-textbox, .form-password, .form-textarea, .form-upload, .form-dropdown').each(function(input){
            input.observe('focus', function(){
                JotForm.lastFocus = input;
            });
        });
    },
    /** 
    * Disables Accept for Google Chrome browsers
    */
    disableAcceptonChrome: function(){
        if (!Prototype.Browser.WebKit) { return; }
        $$('.form-upload').each(function(input){
            if (input.hasAttribute('accept')) {
                var r = input.readAttribute('accept');
                input.writeAttribute('accept', '');
                input.writeAttribute('file-accept', r);
            }
        });
    },

    /**
     * Populate hidden field with user's browser info
     */
    populateBrowserInfo:function(id) {
        var OS = "Unknown OS";
        if (navigator.appVersion.indexOf("iPhone")!=-1) OS ="iOS iPhone";
        else if (navigator.appVersion.indexOf("iPad")!=-1) OS ="iOS iPad";
        else if (navigator.appVersion.indexOf("Android")!=-1) OS ="Android";
        else if (navigator.appVersion.indexOf("Win")!=-1) OS ="Windows";
        else if (navigator.appVersion.indexOf("Mac")!=-1) OS ="MacOS";
        else if (navigator.appVersion.indexOf("Linux")!=-1) OS ="Linux";

        var browser = "Unknown Browser";
        if(navigator.userAgent.indexOf("MSIE") !=-1) browser = "Internet Explorer";
        else if(navigator.userAgent.indexOf("Firefox") !=-1) browser ="Firefox";
        else if(navigator.userAgent.indexOf("Chrome") !=-1) browser ="Chrome";
        else if(navigator.userAgent.indexOf("Safari") !=-1) browser ="Safari";
        else if(navigator.userAgent.indexOf("Opera") !=-1) browser ="Opera";

        var offset = new Date().getTimezoneOffset();
        var sign = (offset < 0)?"+":"";
        var timeZone = 'GMT ' + sign +  -(offset/60);

        var lang = navigator.language || navigator.browserLanguage || navigator.userLanguage;

        var val = 'BROWSER: ' + browser + "\n";
        val += 'OS: ' + OS + "\n";
        val += 'LANGUAGE: ' + lang + "\n";  
        val += 'RESOLUTION: ' + screen.width + "*" + screen.height + "\n";
        val += 'TIMEZONE: ' + timeZone + "\n";
        val += 'USER AGENT: ' + navigator.userAgent + "\n";
        if($(id).value.length > 0)
            $(id).value += "\n";    
        $(id).value += val;
    },

    /**
     * Show Difference Between time ranges
     */
    displayTimeRangeDuration:function(id) {
        var displayDuration = function() {
            if($('input_'+id+'_hourSelectRange')) {
                var sHour = $('input_'+id+'_hourSelect').value;
                var sMin = $('input_'+id+'_minuteSelect').value;
                var sAMPM = $('input_'+id+'_ampm')?$('input_'+id+'_ampm').value:'no';
                var eHour = $('input_'+id+'_hourSelectRange').value;
                var eMin = $('input_'+id+'_minuteSelectRange').value;
                var eAMPM = $('input_'+id+'_ampmRange')?$('input_'+id+'_ampmRange').value:'no';
                var lab = $('input_'+id+'_ampmRange')?'_ampmRange':'_dummy';
                if(sHour.length > 0 && sMin.length > 0 && eHour.length > 0 && eMin.length > 0) {
                    if(sAMPM == 'PM' && sHour != 12) sHour = parseInt(sHour) + 12;
                    if(sAMPM == 'AM' && sHour == 12) sHour = 0;
                    if(eAMPM == 'PM' && eHour != 12) eHour = parseInt(eHour) + 12;
                    if(eAMPM == 'AM' && eHour == 12) eHour = 0;

                    var start = new Date(0, 0, 0, sHour, sMin, 0);
                    var end = new Date(0, 0, 0, eHour, eMin, 0);
                    var diff = end.getTime() - start.getTime();
                    if(diff < 0) { //end time is next day
                        end = new Date(0, 0, 1, eHour, eMin, 0);
                        diff = end.getTime() - start.getTime();
                    }
                    var hours = Math.floor(diff/1000/60/60);
                    diff -= hours*1000*60*60;
                    var min = Math.floor(diff / 1000 / 60);
                    if(min < 10) min = '0' + min;
                    $$('label[for=input_'+id+lab+']').first().update('<b>Total '+hours+':'+min+'</b>');
                    $$('label[for=input_'+id+lab+']').first().setStyle({'color': 'black'});
                } else {
                    $$('label[for=input_'+id+lab+']').first().update('&nbsp');
                }
            }
        };
        $('input_'+id+'_hourSelect').observe('change', displayDuration);
        $('input_'+id+'_minuteSelect').observe('change', displayDuration);
        $('input_'+id+'_hourSelectRange').observe('change', displayDuration);
        $('input_'+id+'_minuteSelectRange').observe('change', displayDuration);
        if($('input_'+id+'_ampm') && $('input_'+id+'_ampmRange')) {
            $('input_'+id+'_ampm').observe('change', displayDuration);
            $('input_'+id+'_ampmRange').observe('change', displayDuration);
        }
    },

    
    /**
     * Set current local time if nodefault not set
     */
    displayLocalTime:function(hh, ii, ampm) {
        if($(hh) && !$(hh).hasClassName('noDefault')) {
            var date = new Date();
            var hour = date.getHours();

            var currentAmpm = "";
            var twentyFour = true;
            if($(ampm)) {
                twentyFour = false;
                currentAmpm = (hour>11)?'PM':'AM';  
                hour = (hour>12)?hour-12:hour;
                hour = (hour == 0)?12:hour;
            }

            var min = date.getMinutes();
            var step = Number($(ii).options[2].value) - Number($(ii).options[1].value);
            min = Math.round(min/step) * step;
            min = this.addZeros(min, 2);
            if(min >= 60) { //ntw roll over to next hour/day
                min = "00";
                hour++;
                if(twentyFour){
                    if(hour == 24) hour = 0;
                } else {
                    if(currentAmpm == 'AM' && hour == 12) currentAmpm = 'PM';
                    else if(currentAmpm == 'PM' && hour == 12) currentAmpm = 'AM';
                    else if(hour == 13) hour = 1;
                }
            }

            $(hh).value = hour;
            $(ii).value = min;

            if($(hh + 'Range')) {
                $(hh + 'Range').value = hour;
                $(ii + 'Range').value = min;
            }
            if($(ampm)) {
                if(currentAmpm == 'PM') {
                    if($(ampm).select('option[value="PM"]').length > 0) $(ampm).value = 'PM';
                    if($(ampm + 'Range') && $(ampm + 'Range').select('option [value=PM]').length > 0) $(ampm + 'Range').value = 'PM';
                } else {
                    if($(ampm).select('option[value="AM"]').length > 0) $(ampm).value = 'AM';
                    if($(ampm + 'Range') && $(ampm + 'Range').select('option [value=AM]').length > 0) $(ampm + 'Range').value = 'AM';
                }
            }
        }
    },

    /**
     * Sets calendar to field
     * @param {Object} id
     */
    setCalendar: function(id, startOnMonday){
        try{
            var calendar = Calendar.setup({
                triggerElement:"input_" + id + "_pick",
                dateField:"year_" + id,
                closeHandler:JotForm.calendarClose,
                selectHandler:JotForm.formatDate,
                startOnMonday:startOnMonday
            });
            $('id_'+id).observe('keyup', function(){
                $('id_'+id).fire('date:changed');
            });
            if(! $('day_' + id).hasClassName('noDefault')){
                JotForm.formatDate({date:(new Date()), dateField:$('id_' + id)});
            }
            var openCalendar = function() {
                if (document.createEvent) {
                    var ele = this;
                    setTimeout(function() {
                        calendar.showAtElement(ele);
                    }, 50);
                }
            };
            if($('input_' + id + '_pick').hasClassName('showAutoCalendar')) {
                $('day_' + id).observe('focus', openCalendar);
                $('day_' + id).observe('click', openCalendar);
                $('month_' + id).observe('focus', openCalendar);
                $('month_' + id).observe('click', openCalendar);
                $('year_' + id).observe('focus', openCalendar);
                $('year_' + id).observe('click', openCalendar);
            }
            $('day_' + id).observe('blur', function() {JotForm.calendarClose(calendar);});
            $('month_' + id).observe('blur', function() {JotForm.calendarClose(calendar);});
            $('year_' + id).observe('blur', function() {JotForm.calendarClose(calendar);});
        }catch(e){
            JotForm.error(e);
        }
    },

    calendarClose: function(calendar){
        var validations = calendar.dateField.className.replace(/.*validate\[(.*)\].*/, '$1').split(/\s*,\s*/);
        if(validations.include("required") || validations.include("disallowPast")) {
            calendar.dateField.validateInput();
        }
        calendar.hide();
    },

    /**
     * Collects all inital values of the fields and saves them as default values
     * to be restored later
     */
    getDefaults: function(){
        $$('.form-textbox, .form-dropdown, .form-textarea').each(function(input){
            if(input.hinted || input.value === ""){ return; /* continue; */ }
            
            JotForm.defaultValues[input.id] = input.value;
        });
        
        $$('.form-radio, .form-checkbox').each(function(input){
            if(!input.checked){ return; /* continue; */ }
            JotForm.defaultValues[input.id] = input.value;
        });
    },
    /**
     * Enables or disables the Other option on radiobuttons/checkboxes
     */
    handleOtherOptions: function(){
        
        $$('.form-radio-other-input, .form-checkbox-other-input').each(function(inp){
            inp.disable().hint(inp.getAttribute('data-otherHint') || 'Other');
        });
        
        $$('.form-radio, .form-checkbox').each(function(input){
            
            var id = input.id.replace(/input_(\d+)_\d+/gim, '$1');
            
            if(id.match('other_')){
                id = input.id.replace(/other_(\d+)/, '$1');
            }
            
            if($('other_'+id)){
                var other = $('other_'+id);
                var other_input = $('input_'+id);
                var otherOption = input.type === 'radio' ? input : other;
                if (input.type === 'checkbox') {
                    other_input.observe('keyup',function(){
                       other.value = other_input.value; 
                    });
                }
                other_input.observe('blur', function(){
                    other_input.value = other_input.value || other_input.getAttribute('data-otherHint');
                });
                other_input.observe('click', function(){
                    other_input.value = other_input.value === other_input.getAttribute('data-otherHint') ? '' : other_input.value;
                });
                // perform only on the "Other" option if input is check box
                otherOption.observe('click', function(){
                    
                    if(other.checked){
                        other_input.enable();
                        other_input.select();
                    }else{
                        if(other_input.hintClear){ other_input.hintClear(); }
                        other_input.disable();
                    }
                });
            }
        });
    },

    handleDateTimeChecks: function() {
        $$('[name$=\[month\]]').each(function(monthElement) {
            var questionId = monthElement.id.split('month_').last();
            var dateElement = $('id_' + questionId);
            if (!dateElement)
                return;

            var dayElement = dateElement.select('#day_' + questionId).first();
            var yearElement = dateElement.select('#year_' + questionId).first();
            var hourElement = dateElement.select('#hour_' + questionId).first();
            var minElement = dateElement.select('#min_' + questionId).first();
            var ampmElement = dateElement.select('#ampm_' + questionId).first();

            var dateTimeCheck = function() {
                var erroredElement = null;

                if (monthElement.value != "" || dayElement.value != "" || yearElement.value != "") {

                    var month = +monthElement.value;
                    var day = +dayElement.value;
                    var year = +yearElement.value;

                    if (isNaN(year) || year < 0) {
                        erroredElement = yearElement;
                    } else if (isNaN(month) || month < 1 || month > 12) {
                        erroredElement = monthElement;
                    } else if (isNaN(day) || day < 1) {
                        erroredElement = dayElement;
                    } else {
                        switch (month) {
                            case 2:
                                if ((year % 4 == 0) ? day > 29 : day > 28) {
                                    erroredElement = dayElement;
                                }
                                break;
                            case 4:
                            case 6:
                            case 9:
                            case 11:
                                if (day > 30) {
                                    erroredElement = dayElement;
                                }                            
                                break;
                            default:
                                if (day > 31) {
                                    erroredElement = dayElement;
                                }
                                break;
                        }
                    }
                }

                if (!erroredElement && hourElement && minElement && (hourElement.value != "" || minElement.value != "")) {
                    var hour = (hourElement.value.strip() == '') ? -1 : +hourElement.value;
                    var min = (minElement.value.strip() == '') ? - 1 : +minElement.value;
                    if (isNaN(hour) || (ampmElement ? (hour < 0 || hour > 12) : (hour < 0 || hour > 23))) {
                        erroredElement = hourElement;
                    } else if (isNaN(min) || min < 0 || min > 59) {
                        erroredElement = minElement;
                    }
                }

                if (erroredElement) {
                    if(erroredElement === hourElement || erroredElement === minElement) {
                        erroredElement.errored = false;
                        JotForm.errored(erroredElement, 'Enter a valid time');
                    } else {
                        erroredElement.errored = false;
                        JotForm.errored(erroredElement, 'Enter a valid date');
                    }
                    dateElement.addClassName('form-line-error');
                    dateElement.addClassName('form-datetime-validation-error');
                } else {
                    JotForm.corrected(monthElement);
                    JotForm.corrected(dayElement);
                    JotForm.corrected(yearElement);
                    if (hourElement && minElement) {
                        JotForm.corrected(hourElement);
                        JotForm.corrected(minElement);    
                    }
                    dateElement.removeClassName('form-line-error');
                    dateElement.removeClassName('form-datetime-validation-error');
                }
            };

            //fired when date is changed by calendar
            dateElement.observe('date:changed', dateTimeCheck);

            monthElement.observe('change', dateTimeCheck);
            dayElement.observe('change', dateTimeCheck);
            yearElement.observe('change', dateTimeCheck);
            if (hourElement && minElement) {
                hourElement.observe('change', dateTimeCheck);
                minElement.observe('change', dateTimeCheck);                
            }
        });
    },
    
    handleTextareaLimits: function(){
        $$('.form-textarea-limit-indicator span').each(function(el){
            var inpID = el.id.split('-')[0];
            if(!$(inpID)){return;} // cannot find the main element
            var limitType = el.readAttribute('type');
            var limit     = el.readAttribute('limit');
            var input = $(inpID);
            var count;

            var countText = function(){
                if(input.hasClassName('form-custom-hint')) {
                    el.update("0/" + limit);
                    return;
                }

                var contents;
                if(input.hasClassName("form-textarea") && input.up('div').down('.nicEdit-main')) { //rich text
                    contents = input.value.stripTags().replace(/&nbsp;/g, ' ');
                } else {
                    contents = input.value;
                }

                if(limitType == 'Words'){
                    count = $A(contents.split(/\s+/)).without("").length;
                }else if(limitType == 'Letters'){
                    count = contents.length;
                }
                if(count > limit){
                    $(el.parentNode).addClassName('form-textarea-limit-indicator-error');
                }else{
                    $(el.parentNode).removeClassName('form-textarea-limit-indicator-error');
                }
                el.update(count + "/" + limit);
            };
            countText();
            input.observe('change', countText);
            input.observe('focus', countText);
            input.observe('keyup', countText);

            //check whether rich text
            if(input.hasClassName("form-textarea") && input.up('div').down('.nicEdit-main')) {
                var cEditable = input.up('div').down('.nicEdit-main');
                cEditable.observe('keyup', function() {
                    input.value = cEditable.innerHTML;
                    countText();
                });
            }
        });
    },
    
    /**
     * Activates all autocomplete fields
     */
    handleAutoCompletes: function(){
        // Get all autocomplete fields
        $H(JotForm.autoCompletes).each(function(pair){
            var el = $(pair.key); // Field itself
            
            el.writeAttribute('autocomplete', 'off');
            
            var parent = $(el.parentNode); // Parent of the field for list to be inserted
            var values = $A(pair.value.split('|')); // Values for auto complete
            
            var lastValue; // Last entered value
            var selectCount = 0; // Index of the currently selected element
            //parent.setStyle('position:relative;z-index:1000;'); // Set parent position to relative for inserting absolute positioned list
            var liHeight = 0; // Height of the list element
            
            // Create List element with must have styles initially
            var list = new Element('div', {
                className: 'form-autocomplete-list'
            }).setStyle({
                listStyle: 'none',
                listStylePosition: 'outside',
                position: 'absolute',
                zIndex: '10000'
            }).hide();
            
            var render = function(){
                
                var dims = el.getDimensions(); // Dimensions of the input box
                var offs = el.cumulativeOffset();
                
                list.setStyle({
                    top: ((dims.height+offs[1])) + 'px',
                    left:offs[0]+'px',
                    width: ((dims.width < 1? 100 : dims.width) - 2) + 'px'
                });
                list.show();
            };
            
            // Insert list onto page
            // parent.insert(list);
            $(document.body).insert(list);
            
            list.close = function(){
                list.update();
                list.hide();
                selectCount = 0;
            };
            
            // Hide list when field get blurred
            el.observe('blur', function(){
                list.close();
            });
            
            // Search entry in values when user presses a key
            el.observe('keyup', function(e){
                var word = el.value;
                // If entered value is the same as the old one do nothing
                if (lastValue == word) {
                    return;
                }
                lastValue = word; // Set last entered word
                list.update(); // Clean up the list first
                if (!word) {
                    list.close();
                    return;
                } // If input is empty then close the list and do nothing
                // Get matches
                
                var fuzzy = el.readAttribute('data-fuzzySearch') == 'Yes';
                var matches;
                
                if (fuzzy) {
                    matches = values.collect(function(v) {
                    if (v.toLowerCase().include(word.toLowerCase())) {
                        return v;
                    }
                }).compact();
                } else {
                    matches = values.collect(function(v) {
                        if (v.toLowerCase().indexOf(word.toLowerCase()) == 0){
                            return v;
                        }
                    }).compact();
                }
                // If matches found
                var maxMatches = el.readAttribute('data-maxMatches');
                if(maxMatches > 0) matches = matches.slice(0,maxMatches);
                if (matches.length > 0) {
                    matches.each(function(match){
                        var li = new Element('li', {
                            className: 'form-autocomplete-list-item'
                        });
                        var val = match;
                        li.val = val;
                        try {
                            val = match.replace(new RegExp('(' + word + ')', 'gim'), '<b>$1</b>');
                        } 
                        catch (e) {
                            JotForm.error(e);
                        }
                        li.insert(val);
                        li.onmousedown = function(){
                            el.value = match;
                            list.close();
                        };
                        list.insert(li);
                    });
                    
                    render();
                    
                    // Get li height by adding margins and paddings for calculating 10 item long list height
                    liHeight = liHeight || $(list.firstChild).getHeight() + (parseInt($(list.firstChild).getStyle('padding'), 10) || 0) + (parseInt($(list.firstChild).getStyle('margin'), 10) || 0);
                    // limit list to show only 10 item at once        
                    list.setStyle({
                        height: (liHeight * ((matches.length > 9) ? 10 : matches.length) + 4) + 'px',
                        overflow: 'auto'
                    });
                } else {
                    list.close(); // If no match found clean the list and close
                }
            });
            
            // handle navigation through the list
            el.observe('keydown', function(e){
                
                //e = document.getEvent(e);
                var selected; // Currently selected item
                // If the list is not visible or list empty then don't run any key actions
                if (!list.visible() || !list.firstChild) {
                    return;
                }
                
                // Get the selected item
                selected = list.select('.form-autocomplete-list-item-selected')[0];
                if(selected){ selected.removeClassName('form-autocomplete-list-item-selected'); }
                
                switch (e.keyCode) {
                    case Event.KEY_UP: // UP
                        if (selected && selected.previousSibling) {
                            $(selected.previousSibling).addClassName('form-autocomplete-list-item-selected');
                        } else {
                            $(list.lastChild).addClassName('form-autocomplete-list-item-selected');
                        }
                        
                        if (selectCount <= 1) { // selected element is at the top of the list
                            if (selected && selected.previousSibling) {
                                $(selected.previousSibling).scrollIntoView(true);
                                selectCount = 0; // scroll element into view then reset the number
                            } else {
                                $(list.lastChild).scrollIntoView(false);
                                selectCount = 10; // reverse the list
                            }
                        } else {
                            selectCount--;
                        }
                        
                        break;
                    case Event.KEY_DOWN: // Down
                        if (selected && selected.nextSibling) {
                            $(selected.nextSibling).addClassName('form-autocomplete-list-item-selected');
                        } else {
                            $(list.firstChild).addClassName('form-autocomplete-list-item-selected');
                        }
                        
                        if (selectCount >= 9) { // if selected element is at the bottom of the list
                            if (selected && selected.nextSibling) {
                                $(selected.nextSibling).scrollIntoView(false);
                                selectCount = 10; // scroll element into view then reset the number
                            } else {
                                $(list.firstChild).scrollIntoView(true);
                                selectCount = 0; // reverse the list
                            }
                        } else {
                            selectCount++;
                        }
                        break;
                    case Event.KEY_ESC:
                        list.close(); // Close list when pressed esc
                        break;
                    case Event.KEY_TAB:
                    case Event.KEY_RETURN:
                        if (selected) { // put selected field into the input bıx
                            el.value = selected.val;
                            lastValue = el.value;
                        }
                        list.close();
                        if (e.keyCode == Event.KEY_RETURN) {
                            e.stop();
                        } // Prevent return key to submit the form
                        break;
                    default:
                        return;                
                }
            });
        });
        
    },
    
    /**
     * Returns the extension of a file
     * @param {Object} filename
     */
    getFileExtension: function(filename){
        return (/[.]/.exec(filename)) ? (/[^.]+$/.exec(filename))[0] : undefined;
    },
    
    /**
     * Fill fields from the get values prepopulate
     */
    prePopulations: function(){
{       // Event simulator
        Element.prototype.triggerEvent = function(eventName){
            if (document.createEvent) {
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent(eventName, true, true);
                return this.dispatchEvent(evt);
            }
            if (this.fireEvent) {
                return this.fireEvent('on' + eventName);
            }
        }
}
        $H(document.get).each(function(pair){
            // Will skip very short URL keys to avoid mix-ups
            if(pair.key.length < 3){ return; /* continue; */ }
            
            var n = '[name*="_' + pair.key + '"]';
            var input;

            input = $$('.form-star-rating'+n)[0];
            if(input) {
                input.setRating(parseInt(pair.value));
                return;
            }

            input = $$('.form-slider'+n)[0]; //Add classname in builder?
            if(input) {
                input.setSliderValue(parseInt(pair.value));
                return;
            }

            input = $$('.form-textbox%s, .form-dropdown%s, .form-textarea%s, .form-hidden%s'.replace(/\%s/gim, n))[0];

            if(input && input.readAttribute('data-type') == 'input-grading') {
                var grades = pair.value.split(',');
                var stub = input.id.substr(0, input.id.lastIndexOf('_')+1);
                for(var i=0; i<grades.length; i++) {
                    if($(stub + i)) $(stub + i).value = grades[i];
                }
            } else if (input) {
                input.value = pair.value.replace(/\+/g, ' ');
                JotForm.defaultValues[input.id] = input.value;
            }
            $$('.form-textbox%s, .form-textarea%s, .form-hidden%s'.replace(/\%s/gim, n)).each(function(input){
                //simulate 'keyup' event to execute conditions upon prepopulation
                input.triggerEvent('keyup');
            });
            $$('.form-dropdown%s'.replace(/\%s/gim, n)).each(function(input){
                //simulate 'change' event to execute conditions upon prepopulation
                input.triggerEvent('change');
            });
            $$('.form-checkbox%s, .form-radio%s'.replace(/\%s/gim, n)).each(function(input){
                //input.checked = $A(pair.value.split(',')).include(input.value);
                //Emre: when checkboxed is checked, total count does not increase on payment forms  (79814)
                if($A(pair.value.split(',')).include(input.value)){
                    input.click();
                }
            });
        });
    },
    /**
     * Reset form while keeping the values of hidden fields
     * @param {Object} frm
     */
    resetForm: function(frm){
        var hiddens = $(frm).select('input[type="hidden"]');
        hiddens.each(function(h){ h.__defaultValue = h.value; });
        $(frm).reset();
        hiddens.each(function(h){ h.value = h.__defaultValue; });
        return frm;
    },
    /**
     * Bring the form data for edit mode
     */
    editMode: function(data, noreset, skipFields){

        if(JotForm.ownerView) {
            $$('.always-hidden').each(function(el) {
                 el.removeClassName('always-hidden');
            });
        }

        skipFields = skipFields || [];
        
        var populateData = function(res){
            
            if(!noreset){
                // Prevent autocompleting old values aka. form input cache
                
                $A(JotForm.forms).each(function(frm){
                    JotForm.resetForm(frm);
                });
            }
            
            $H(res.result).each(function(pair){
                var qid = pair.key, question = pair.value;
                try{
                    // Skip if this field type was specified as should be skipped
                    if($A(skipFields).include(question.type)){
                        return true; // continue;
                    }
  
                    switch (question.type) {
                        case "control_fileupload":
                            if($('input_' + qid)) {
                                if($('input_' + qid).uploadMarked == question.value) {
                                    break;
                                }
                            }

                            //Emre: to provide editing file list in multi-upload (49061)
                            setTimeout(function() {
                                if($$('#id_' + qid + ' .qq-upload-list')[0]) {

                                    var questionValue = question.value;
                                    var multiUploadFiles;
                                    var multiUploadFileNames;
                                    questionValue = questionValue.replace(/<a/g, '<li class=" qq-upload-success"><span class="qq-upload-file"><a');
                                    questionValue = questionValue.replace(/<\/a>/g, '<\/a><\/span><span class="qq-upload-delete">X<\/span><\/li>');
                                    questionValue = questionValue.replace(/<br>/g, '');

                                    $$('#id_' + qid + ' ul.qq-upload-list')[0].update(questionValue);

                                    setTimeout(function() {
                                        var fileList = $$('#id_' + qid + ' ul.qq-upload-list li span.qq-upload-delete');
                                        if(fileList) {
                                            fileList.each(function(li) {
                                                li.observe('click', function() {

                                                    this.up().hide();
                                                    var thisUpSelectA = this.up().select('a')[0].text;
                                                    if(!thisUpSelectA) {
                                                        thisUpSelectA = this.up().select('a')[0].innerText;
                                                    }
                                                    $('uploadedBefores_' + qid).value = $('uploadedBefores_' + qid).value.replace(thisUpSelectA, '');
                                                    if(!$('uploadedBefores_' + qid).value) {
                                                        $('uploadedBefores_' + qid).value = ",";
                                                    }

                                                });
                                            });
                                        }

                                    }, 200);
                                    multiUploadFiles = $$('#id_' + qid + ' ul.qq-upload-list li a');
                                    multiUploadFileNames = "";
                                    if(multiUploadFiles) {
                                        multiUploadFiles.each(function(n) {
                                            if(n.text) {
                                                multiUploadFileNames += n.text + ",";
                                            } else if(n.innerText) {
                                                multiUploadFileNames += n.innerText + ",";
                                            } else {
                                                n.up('li.qq-upload-success').hide();
                                            }
                                        });
                                        multiUploadFileNames = multiUploadFileNames.substring(0, multiUploadFileNames.length - 1);

                                    }

                                    $('cid_' + qid).insert({
                                        after : new Element('input', {
                                            id : 'uploadedBefores_' + qid,
                                            type : 'hidden',
                                            name : 'uploadedBefore' + qid
                                        }).putValue(multiUploadFileNames)
                                    });

                                } else {
                                    $$('#clip_' + qid + ', #link_' + qid + ', #old_' + qid).invoke('remove');

                                    $('input_' + qid).uploadMarked = question.value;
                                    $('input_' + qid).resetUpload();
                                    var file = question.value.split("/");
                                    var filename = file[file.length - 1];
                                    var ext = JotForm.getFileExtension(filename);

                                    if(ext!==undefined){
                                        if(JotForm.imageFiles.include(ext.toLowerCase())) {
                                            var clipDiv = new Element('div', {
                                                id : 'clip_' + qid
                                            }).setStyle({
                                                height : '50px',
                                                width : '50px',
                                                overflow : 'hidden',
                                                marginRight : '5px',
                                                border : '1px solid #ccc',
                                                background : '#fff',
                                                cssFloat : 'left'
                                            });
                                            var img = new Element("img", {
                                                src : question.value,
                                                width : 50
                                            });
                                            clipDiv.insert(img);
                                            $('input_' + qid).insert({
                                                before : clipDiv
                                            });
                                        }
                                    
                                        var linkContainer = new Element('div', {
                                        id : 'link_' + qid
                                        });
                                        $('input_' + qid).insert({
                                            after : linkContainer.insert(new Element('a', {
                                                href : question.value,
                                                target : '_blank'
                                            }).insert(filename.shorten(40)))
                                        });
                                        $('input_' + qid).insert({
                                            after : new Element('input', {
                                                type : 'hidden',
                                                name : 'input_' + qid + '_old',
                                                id : 'old_' + qid
                                            }).putValue(question.items)
                                        });
                                    }  
                                }
                            }, 200);
                            break;
                        case "control_scale":
                        case "control_radio":

                            //Emre: when session is used, "question.name" seems undefined in forms (42176)
                            //
                            if(question.name == undefined) {
                                var radios = $$("#id_" + qid + ' input[type="radio"]');
                            } else {
                                var radios = document.getElementsByName("q" + qid + "_" + ((question.type == "control_radio" || question.type == "control_scale") ? question.name : qid));
                            }

                            $A(radios).each(function(rad) {

                                if(rad.value == question.value) {
                                    rad.checked = true;
                                }
                            });
                            break;
                        case "control_checkbox":
                            var checks = $$("#id_" + qid + ' input[type="checkbox"]');
                            var i = 0;
                            $A(checks).each(function(chk) {
                                // if item selected do not include 'other', question.items is array. else, object
                                if(Object.prototype.toString.call( question.items ) === '[object Array]') {
                                    if(question.items.include(chk.value)) {
                                        chk.checked = true;
                                    }
                                } else {
                                    // question.items is object.  find a different means of getting data
                                    if(question.items[i] == chk.value) {
                                        $('input_' + qid + "_" + i).checked = true;
                                        i++;
                                    } else if (question.items['other'] != null) {
                                        $('other_' + qid).checked = true;
                                        $("input_" + qid).disabled = false;
                                        $("input_" + qid).value = question.items['other'];
                                    }
                                }
                            });
                            break;
                        case "control_rating":
                            if($('input_' + qid)) {($('input_' + qid).setRating(question.value));
                            }
                            break;
                        case "control_grading":
                            //Emre: to prevent grading problem (49061)
                            //var boxes = document.getElementsByName("q" + qid +  "_grading[]");
                            //var boxes = $
                            //console.log("grading boxes", boxes);

                            var props = arguments[0][1];
                            var q_id = arguments[0][0];

                            if(!props.isEmpty){
                                var total = 0;
                                $A(props.items).each(function(val, i){
                                    var box = document.getElementById("input_"+q_id+"_" + i);
                                    box.putValue(val);
                                    total += parseInt(val || 0);
                                });

                                //set total
                                var tot = document.getElementById("grade_point_"+q_id);
                                tot.update(total);
                            }


                            // console.log("grading",arguments[0]);
                            // $A(boxes).each(function(box, i) {
                            //     box.putValue(question.items[i]);
                            // });
                            break;
                        case "control_slider":
                            $('input_' + qid).setSliderValue(question.value);
                            break;
                        case "control_range":
                            $('input_' + qid + "_from").putValue(question.items.from);
                            $('input_' + qid + "_to").putValue(question.items.to);
                            break;

                        case "control_matrix":
                            var extended, objj = false;
                            // If you don't select first line or first row on a matrix
                            // Items will come as an object instead of an array
                            // It's because keys don't start from zero
                            // I have to simulate the array on this sittuations
                            if(!Object.isArray(question.items)) {
                                extended = $H(question.items);
                                objj = true;
                            } else {
                                extended = $A(question.items);
                            }
                            
                            if(question.name == undefined) {
                                // Strips the question type (radio or string) from the question's dom name
                                var firstElementInMatrix = $$("#id_" + qid + ' input')[0] || $$("#id_" + qid + ' select')[0];
                                var questionTmpName = firstElementInMatrix.name;
                                var posOfDashPlusOne = questionTmpName.indexOf('_') + 1;
                                var lengthToBracket = questionTmpName.indexOf('[') - posOfDashPlusOne;                              
                                question.name = questionTmpName.substr(posOfDashPlusOne, lengthToBracket);
                            }

                            extended.each(function(item, i) {
                                // Here is the simulation of an array :)
                                if(objj) {
                                    i = item.key;
                                    item = item.value;
                                }

                                if(Object.isString(item)) {
                                    var els = document.getElementsByName("q" + qid + "_" + question.name + "[" + i + "]");
                                    $A(els).each(function(el) {
                                        if(el.value == item) {
                                            el.checked = true;
                                        }
                                    });
                                } else {
                                    $A(item).each(function(it, j) {
                                        var els = document.getElementsByName("q" + qid + "_" + question.name + "[" + i + "][]");
                                        if(els[j].className == "form-checkbox") {
                                            $A(els).each(function(el) {
                                                if(el.value == it) {
                                                    el.checked = true;
                                                }
                                            });
                                        } else {
                                            els[j].value = it;
                                        }
                                        
                                    });
                                }
                            });
                            break;
                        case "control_datetime":
                        case "control_fullname":
                            $H(question.items).each(function(item) {
                                if($(item.key + "_" + qid)) {
                                    ($(item.key + "_" + qid).value = item.value);
                                }
                            });
                            break;
                        case "control_phone":
                        case "control_birthdate":
                        case "control_address":
                        case "control_time":
                            $H(question.items).each(function(item) {
                                if($('input_' + qid + "_" + item.key)) {($('input_' + qid + "_" + item.key).putValue(item.value));
                                }
                            });
                            break;
                        case "control_autoincrement":
                        case "control_hidden":
                            if($('input_' + qid)) {
                                if(JotForm.saveForm || document.get.mode == 'edit') {
                                    $('input_' + qid).putValue(question.value);
                                } else {
                                    var sec = $$('.form-section')[0];$$('.form-section li[title="Hidden Field"]')[0];
                                    //Emre:80874 Order problem of hidden fields
                                    var hiddenElements = $$('.form-section li[title="Hidden Field"]');
                                    var liOfHidden = '<li id="id_' + qid + '" class="form-line" title="Hidden Field">' + '<label for="input_' + qid + '" id="label_' + qid + '" class="form-label-left"> ' + question.text + ' </label>' + '<div class="form-input" id="cid_' + qid + '"></div></li>';
                                    if(hiddenElements.size() > 0){
                                        hiddenElements.last().insert({after:liOfHidden});
                                    }else{
                                        sec.insert({top : liOfHidden});
                                    }
                                    //--
                                    $('cid_' + qid).insert($('input_' + qid).putValue(question.value));
                                    //Emre: on ie7-8 changing type is not possible so on edit page "hidden type" cannot be converted to "text" (43655)
                                    var hiddenInput = $('input_' + qid);
                                    hiddenInput.replace('<input type="text" id="' + hiddenInput.id + '" name="' + hiddenInput.name + '" value="' + hiddenInput.value + '">');
                                    $('input_' + qid).setStyle({
                                        opacity : 0.9,
                                        border : '1px dashed #999',
                                        padding : '3px'
                                    });
                                }

                            }
                            break;
                        case 'control_payment':
                        case 'control_stripe':
                        case 'control_paypal':
                        case 'control_paypalpro':
                        case 'control_clickbank':
                        case 'control_2co':
                        case 'control_worldpay':
                        case 'control_googleco':
                        case 'control_onebip':
                        case 'control_authnet':
                            $H(question.items).each(function(item) {
                                if(item.key == "price") {// Donations
                                    $('input_' + qid + '_donation').value = item.value;
                                } else if("pid" in item.value) {
                                    if($('input_' + qid + '_' + item.value.pid)) {
                                        $('input_' + qid + '_' + item.value.pid).checked = true;
                                        if("options" in item.value) {
                                            item.value.options.each(function(option, i)  {
                                                if($('input_' + qid + '_' + option.type + '_' + item.value.pid + '_' + i)) {
                                                    $('input_' + qid + '_' + option.type + '_' + item.value.pid + '_' + i).value = option.selected;                                                }
                                            });
                                        }
                                    }
                                }
                            });
                            //--- DISABLE EDITS FOR PAYMENT INFO EXCEPT PURCHASE ORDER
                            if(question.type !== "control_payment"){
                                $$("#id_" + qid + " input").invoke('writeAttribute','readonly','true');
                                $$("#id_" + qid + " input").each(function (el) {
                                    el.stopObserving('click');
                                });
                                $$("#id_" + qid + " input").invoke('writeAttribute','onclick','return false');
                            }

                            //--- COUNT TOTAL AFTER LOADING VALUES ABOVE
                            JotForm.countTotal(JotForm.prices);
                            break;
                        case 'control_email':
                            var emailInput = $('input_' + qid);
                            if(emailInput) {
                                emailInput.putValue(question.value);
                                emailInput = $('input_' + qid + '_confirm');
                                if (emailInput) {
                                    emailInput.putValue(question.value);
                                }
                            }
                            break;
                        case 'control_textarea':
                            if(question.value.length > 0 ) {
                                //Set nicEditor content if exists
                                if($('input_' + qid).up('div').down('.nicEdit-main') && nicEditors && nicEditors.findEditor('input_' + qid)) {
                                    nicEditors.findEditor('input_' + qid).setContent(question.value);
                                } else {
                                    $('input_' + qid).putValue(question.value);
                                }
                                if($('input_' + qid).hasClassName('form-custom-hint')) {
                                    $('input_' + qid).removeClassName('form-custom-hint').removeAttribute('spellcheck');
                                    $('input_' + qid).hasContent = true;
                                    $('input_' + qid).run('focus');
                                }
                            } else if($('input_' + qid).hasClassName('form-custom-hint')) {
                                $('input_' + qid).run('blur');
                            }
                            break;
                        case 'control_signature':
                            $('id_' + qid).select('.form-input')[0].update("<img src='" + question.value + "' />");
                            break;
                        case "control_widget": //if widget set value as data-value attribute
                            $("customFieldFrame_" + qid).setAttribute("data-value", question.value);
                        default:
                            if($('input_' + qid)) {
                                ($('input_' + qid).putValue(question.value));
                            }
                            break;
                    }

                }catch(e){
                    //console.error(e);
                }
            });
            
            // After populating the form run condition checks
            $H(JotForm.fieldConditions).each(function(pair){
                var field = pair.key;
                var event = pair.value.event;
                
                // JotForm.info("Has Condition:", field, $(field));
                if(!$(field)){ return; }
                
                $(field).run(event);
            });
        };
        
        if(data){
            populateData(data);
        }else{
            var a = new Ajax.Request('server.php', {
                parameters: {
                    action: 'getSubmissionResults',
                    formID: document.get.sid
                },
                evalJSON: 'force',
                onComplete: function(t){
                    var res = t.responseJSON;

                    if (res.success) {
                        populateData(res);
                        
                        $$('input[name="formID"]')[0].insert({
                            after: new Element('input', {
                                type: 'hidden',
                                name: 'editSubmission'
                            }).putValue(document.get.sid)
                        });
                        
                        if(document.get.mode == "inlineEdit" || document.get.mode == 'submissionToPDF'){
                            $$('input[name="formID"]')[0].insert({
                                after: new Element('input', {
                                    type: 'hidden',
                                    name: 'inlineEdit'
                                }).putValue("yes")
                            });
                        }
                        JotForm.getContainer($$('.form-captcha')[0]).hide();

                        if (document.get.mode == 'submissionToPDF') {
                            $$('.form-section').each(function(value)
                            {
                                value.setStyle({
                                    display: 'inline'
                                });
                            });

                            $$('.form-section-closed').each(function(value) {
                                value.setStyle({
                                    height: 'auto'
                                });
                            });
                            
                            var a = new Ajax.Request('server.php', {
                                parameters:  {
                                    action: 'getSetting',
                                    identifier: 'form',
                                    key: 'columnSetting'
                                },
                                evalJSON: 'force',
                                onComplete: function(t) {
                                    var columnSettings = t.responseJSON.value;
                                    var excludeList = $H();
                                    columnSettings.each(function(setting){
                                        if (!isNaN(parseInt(setting)))
                                            excludeList['id_' + setting] = true;
                                    });
                                    var autoHide = columnSettings.indexOf('autoHide') > -1;
                                    var showNonInputs = columnSettings.indexOf('showNonInputs') > -1;

                                    var formElement = $$('.jotform-form')[0];

                                    if (columnSettings.indexOf('showIP') > -1)
                                        formElement.insert({top: new Element('div').update('IP: ')});;
                                    if (columnSettings.indexOf('created_at') == -1)
                                        formElement.insert({top: new Element('div').update('Submission Date: ' + res.result.created_at.value)});
                                    if (columnSettings.indexOf('id') == -1)
                                        formElement.insert({top: new Element('div').update('Submission ID: ' + document.get.sid)});

                                    $$('.form-line').each(function(value) {
                                        if (excludeList(value.id))
                                            value.setStyle({display: 'none'});
                                        else
                                            value.setStyle({display: ''});
                                    });
                                }.bind(this)
                            });
                        }
                    }
                }.bind(this)
            });
        }        
    },
    /**
     * add the given condition to conditions array to be used in the form
     * @param {Object} qid id of the field
     * @param {Object} condition condition array
     */
    setConditions: function(conditions){

        conditions.reverse();

        JotForm.conditions = conditions;
         // Ozan, IMPORTANT NOTE: To enable chainig multiple field/email actions to a single/multiple conditions,
         // any "condition.action" is expected to be an array, regardless of "condition.type". Since old conditions
         // are stored in the database with a single action, "condition.action" is converted to an array, concatting 
         // the only action which condition has.
        conditions.each(function(condition) {
            condition.action = [].concat(condition.action); 
        });
    },

    setCalculations: function(calculations) {
        JotForm.calculations = calculations;
    },
    /**
     * Shows a field
     * @param {Object} field
     */
    showField: function(field){
        
        var element = null;
        var idField = $('id_' + field);
        var cidField = $('cid_' + field);
        var sectionField = $('section_' + field);

        if (sectionField && cidField) { // Form collapse
            element = sectionField;
        } else if (cidField && !idField) { // Heading
            element = cidField;
        } else { // Regular field
            element = idField;
        }

        if (!element) {
            return element;
        }

        element.removeClassName('form-field-hidden');
        
        // kemal:bug::#145986 Form collapse bug
        if(sectionField){
            if(element.hasClassName('form-section-closed')){ //if a closed form-section
                //check for .form-collapse-table has class form-collapse-hidden
                if(element.select('.form-collapse-table')[0].hasClassName('form-collapse-hidden')){
                    //element is hidden remove class add class
                    element.removeClassName('form-section-closed');
                    element.addClassName('form-section');
                    element.setStyle({
                        height:"auto",
                        overflow:"hidden"
                    });
                }else{
                    //element is visible do not add auto height
                    element.setStyle({
                        overflow:"hidden"
                    });
                }
            }else{
                //case for status = closed
                element.setStyle({
                    height:"auto",
                    overflow:"hidden"
                });
            }   
        }

        return element.show();
    },
    
    /**
     * Hides a field
     * @param {Object} field
     */
    hideField: function(field){
        var idPrefix = 'id_';
        
        // For headings
        if($('cid_'+field) && !$('id_'+field)){
            idPrefix = 'cid_';
        }

       // For form collapses
        if($('cid_'+field) && $('section_'+field)){
            idPrefix='section_';
        }
        var element = $(idPrefix+field);
        
        if(element) {
            element.addClassName('form-field-hidden');
            return element.hide();
        }
    },
    
    /**
     * Checks the fieldValue by given operator string
     * @param {Object} operator
     * @param {Object} condValue
     * @param {Object} fieldValue
     */
    checkValueByOperator: function(operator, condValueOrg, fieldValueOrg){
        
        var fieldValue = Object.isBoolean(fieldValueOrg)? fieldValueOrg : fieldValueOrg.toString().strip().toLowerCase();
        var condValue  = Object.isBoolean(condValueOrg)? condValueOrg : condValueOrg.toString().strip().toLowerCase();

        // JotForm.log('if "%s" %s "%s"', fieldValue, operator, condValue, "\t\t\t=> Originals:", "Field: '", fieldValueOrg, "', Cond: '", condValueOrg,"'");

        switch (operator) {
            case "equals":
            case "quantityEquals":
            case "equalDate":
                return fieldValue == condValue;
            case "equalDay":
                return JotForm.getDayOfWeek(fieldValue) == condValue;
            case "notEquals":
            case "notEqualDate":
            case "quantityNotEquals":
                return fieldValue != condValue;
            case "notEqualDay":
                return JotForm.getDayOfWeek(fieldValue) != condValue;
            case "endsWith":
                return fieldValue.endsWith(condValue);
            case "notEndsWith":
                return !fieldValue.endsWith(condValue);
            case "startsWith":
                return fieldValue.startsWith(condValue);
            case "notStartsWith":
                return !fieldValue.startsWith(condValue);                
            case "contains":
                return fieldValue.include(condValue);
            case "notContains":
                return !fieldValue.include(condValue);
            case "greaterThan":
            case "quantityGreater":
                return (parseInt(fieldValue, 10) || 0) > (parseInt(condValue, 10) || 0);
            case "lessThan":
            case "quantityLess":
                //Emre: if Scale Rating doesn't have value it returns "true" so we need to check wheater its length is greater than 0 (52809)
                //fieldValue is string, not number
                if(fieldValue.length){
                    return (parseInt(fieldValue, 10) || 0) < (parseInt(condValue, 10) || 0);
                }else{
                    return false;
                }
            case "isEmpty":
                if(Object.isBoolean(fieldValue)){ return !fieldValue; }
                return fieldValue.empty();
            case "isFilled":
                if(Object.isBoolean(fieldValue)){ return fieldValue; }
                return !fieldValue.empty();
            case "before":
                return fieldValueOrg < condValueOrg;
            case "after":
                return fieldValueOrg > condValueOrg;
            default:
                JotForm.error("Could not find this operator", operator);
        }
        return false;
    },

    getDayOfWeek: function(date) {
        date = new Date(date);
        var days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
        return days[date.getDay()];
    },
    
    typeCache: {},   // Cahcke the check type results for performance
    /**
     * 
     * @param {Object} id
     */
    getInputType: function(id){  
        if(JotForm.typeCache[id]){ return JotForm.typeCache[id]; }
        var type = false;
        if($('input_'+id)){
            type = $('input_'+id).nodeName.toLowerCase() == 'input'? $('input_'+id).readAttribute('type').toLowerCase() : $('input_'+id).nodeName.toLowerCase();
            if($('input_'+id).hasClassName("form-radio-other-input")){
                type = "radio";
            }
            if($('input_'+id).hasClassName("form-checkbox-other-input")){
                type = "checkbox";
            }
            // Neil: set type for autocomplete fields
            if($('input_'+id).hasClassName('form-autocomplete')){
                type = "autocomplete";
            }

            if($('input_'+id).hasClassName('form-slider')){
                type = 'slider';
            }

            if($('input_'+id).hasClassName('form-widget')){
                type = 'widget';
            }
            
        }else if($('input_'+id+'_pick')){
            type = 'datetime';
        }else if($('input_'+id+'_month')){
            type = 'birthdate';
        } else if($('input_'+id+'_hourSelect')) {
            type = 'time';
        } else if($$('#id_'+id +' .form-product-item').length > 0) {
            type = $$('#id_'+id +' .form-product-item')[0].select('input')[0].readAttribute('type').toLowerCase();
        } else if($$('#id_'+id +' .form-address-table').length > 0) {
            type = 'address';
        } else if($$('input[id^=input_' + id +'_]')[0] && $$('input[id^=input_' + id +'_]')[0].hasClassName('form-grading-input')) {
            type = 'grading';
        } else if($$('#id_'+id +' .pad').length > 0) {
            type = 'signature';
        } else {
            if($$('#id_'+id+' input')[0]){
                type = $$('#id_'+id+' input')[0].readAttribute('type').toLowerCase();
                if(type == "text" || type == 'tel'){
                    type = "combined";
                }
            }
        }
        JotForm.typeCache[id] = type;
        return type;
    },
    /**
     * Parses ISO Date string to a real date
     * @param {Object} str
     */
    strToDate: function(str){
        // When cannot parse return an invalid date
        var invalid = new Date(undefined);
        var match   = /(\d{4})\-(\d{2})-(\d{2})T?(\d{2})?\:?(\d{2})?/gim;
        
        if(str.empty()){ return invalid; }
        
        // if(!str.include("T")){ str += "T00:00"; }
        
        if(!match.test(str)){ return invalid; }
        
        var d = new Date();
        str.replace(match, function(all, year, month, day, hour, minutes){
            d.setYear(parseInt(year, 10));
            d.setMonth(parseInt(month, 10)-1);
            d.setDate(parseInt(day, 10));
            if(hour){
                d.setHours(parseInt(hour, 10));
                d.setMinutes(parseInt(minutes, 10));
            }
            return all;
        });
        
        //JotForm.log("Date:", str, d);
        
        return d;
    },

    getBirthDate: function(id) {
        var day = $('input_'+id+'_day').getValue()||"%empty%";
        var month = $('input_'+id+'_month').selectedIndex||"%empty%";
        month = String(month);
        var year = $('input_'+id+'_year').getValue()||"%empty%";
        var date = year + "-" + (month.length==1?'0'+month:month) + "-" + (day.length==1?'0'+day:day);
        if(date.include("%empty%")) return "";
        return date;
    },

    get24HourTime: function(id) {
        var hour = $('input_'+id+'_hourSelect').getValue();
        if(hour == "") return "";
        var minute = $('input_' + id + '_minuteSelect').getValue();
        if(minute.length == 0) minute = "00";
        var ampm = ($('input_' + id + '_ampm'))?$('input_' + id + '_ampm').getValue():'';
        hour = Number(hour);
        if(ampm == 'PM' && hour != 12) {
            hour += 12;
        } else if(ampm == 'AM' && hour == 12) { 
            hour = 0;
        }
        hour = (hour<10)?"0"+hour:String(hour);
        return hour + minute;
    },
    
    getDateValue: function(id){
        var date = "";
        if($('year_'+id)){
            date += ($('year_'+id).value || "%empty%");
        }
        if($('month_'+id)){
            date += "-"+($('month_'+id).value || "%empty%");
        }
        if($('day_'+id)){
            date += "-"+($('day_'+id).value || "%empty%");
        }
        
        if(date.include("%empty%")){
            JotForm.info("Wrong date: " + date);
            return "";
        }
        var h="";
        if($('ampm_'+id)){
            if($('hour_'+id)){
                h = $('hour_'+id).value;
                if($('ampm_'+id).value == 'pm'){
                    h = parseInt(h, 10)+12;
                }
                if(h == "24"){
                    h = 0;
                }
                date += "T"+ ((h.length == 1? "0"+h : h) || "00");
            }
        }else{
            if($('hour_'+id)){
                h = $('hour_'+id).value;
                date += "T"+((h.length == 1? "0"+h : h) || "00");
            }
        }
        
        if($('min_'+id)){
            date += ":"+($('min_'+id).value || "00");
        }
        if(h === ""){
            date += "T00:00";
        }
        return date;
    },
    /**
     * 
     * @param {Object} condition
     */
    checkCondition: function(condition){
        var any=false, all=true;
        var filled;
        $A(condition.terms).each(function(term){
            var value;
            try{
                var fieldType = JotForm.getInputType(term.field);
                switch(fieldType){
                    case "combined":
                        if (['isEmpty', 'isFilled'].include(term.operator)) {
                            filled = $$('#id_'+term.field+' input').collect(function(e){ return e.value; }).any();
                            
                            if(JotForm.checkValueByOperator(term.operator, term.value, filled)){
                                any = true;
                            }else{
                                all = false;
                            }
                            
                            return; /* continue; */ 
                        }
                    break;
                    case "address":
                        if (['isEmpty', 'isFilled'].include(term.operator)) {
                            filled = $$('#id_'+term.field+' input').collect(function(e){ return e.value; }).any();
                            if(JotForm.checkValueByOperator(term.operator, term.value, filled)){
                                any = true;
                            }else{
                                all = false;
                            }
                        } else {
                            var option = $('input_'+term.field+'_country').select('option[value=' + term.value + ']');
                            if(term.operator == 'equalCountry') {
                                if(option[0].selected) {
                                    any = true;
                                }else{
                                    all = false;
                                }
                            } else if(term.operator == 'notEqualCountry') {
                                if(!option[0].selected) {
                                    any = true;
                                }else{
                                    all = false;
                                }
                            }
                        }
                    break;
                    case "birthdate":
                    case "datetime":
                        value = (fieldType=="datetime")?JotForm.getDateValue(term.field):JotForm.getBirthDate(term.field);
                        if(value === undefined){ return; /* continue; */ }
                        
                        if (['isEmpty', 'isFilled'].include(term.operator)) {
                            if(JotForm.checkValueByOperator(term.operator, term.value, value)){
                                any = true;
                            }else{
                                all = false;
                            }
                            
                        } else {
                            var termValue = term.value;
                            termValue = term.value.toLowerCase();
                            if(termValue.indexOf('today') > -1) {
                                var offset = parseInt(termValue.split('today')[1].trim()) || 0;
                                var comparativeDate = new Date();
                                comparativeDate.setDate(comparativeDate.getDate() + offset);
                                var year = comparativeDate.getFullYear();
                                var month = comparativeDate.getMonth() + 1;
                                month = (month < 10)?'0' + month : month;
                                var day = comparativeDate.getDate();
                                day = (day < 10)?'0' + day : day;
                                termValue = year + "-" + month + "-" + day;
                            }

                            if(['equalDate', 'notEqualDate'].include(term.operator)){
                                if(JotForm.checkValueByOperator(term.operator, JotForm.strToDate(termValue), JotForm.strToDate(value.split('T')[0]))){
                                    any = true;
                                }else{
                                    all = false;
                                }
                            } else if(['equalDay', 'notEqualDay'].include(term.operator)) {
                                if(JotForm.checkValueByOperator(term.operator, termValue, JotForm.strToDate(value))){
                                    any = true;
                                }else{
                                    all = false;
                                }
                            }else{
                                if(JotForm.checkValueByOperator(term.operator, JotForm.strToDate(termValue), JotForm.strToDate(value))){
                                    any = true;
                                }else{
                                    all = false;
                                }
                            }
                        }
                    break;
                    case "time":
                        value = JotForm.get24HourTime(term.field);
                        var termValue = (!term.value)?"":term.value.replace(/:/, "");
                        if (termValue.length == 3) termValue = "0" + termValue;
                        if(term.operator == 'before'  && value.empty()) {
                            all = false;
                        } else {
                            if(JotForm.checkValueByOperator(term.operator, termValue, value))
                                any = true;
                            else
                                all = false;
                        }
                    break;
                    case "checkbox":
                    case "radio":
                        if (['isEmpty', 'isFilled'].include(term.operator)) {
                            filled = $$('#id_'+term.field+' input').collect(function(e){ return e.checked; }).any();
                            
                            if(JotForm.checkValueByOperator(term.operator, term.value, filled)){
                                any = true;
                            }else{
                                all = false;
                            }
                            
                            return; /* continue; */ 
                        }
                        if(term.value) term.value = term.value.replace(/&amp;/g, '&');

                        $$('#id_'+term.field+' input').each(function(input){
                            if(input.hasClassName('form-'+fieldType+'-other') &&  input.checked) {
                                value = '-- Other --';
                            } else {
                                value = input.checked? input.value : '';
                            }
                            
                            if(JotForm.checkValueByOperator(term.operator, term.value, value)){
                                any = true;
                            }else{
                                // If not equals item is found condition should fail
                                if(term.operator == 'notEquals' && term.value == value){
                                    any = false;
                                    all = false;
                                    throw $break;
                                }
                                
                                if (input.value == term.value) {
                                    all = false;
                                }
                            }
                        });
                    break;
                    case "select":

                        if(term.value) term.value = term.value.replace(/&amp;/g, '&');

                        if($('input_'+term.field).multiple) {
                            if(term.operator == 'equals') {
                                var option = $('input_'+term.field).select('option[value=' + term.value + ']');
                                if(option.length > 0 && option[0].selected) {
                                    any = true;
                                }else{
                                    all = false;
                                }
                            } else if(term.operator == 'notEquals') {
                                var option = $('input_'+term.field).select('option[value=' + term.value + ']');
                                if(option.length > 0 && !option[0].selected) {
                                    any = true;
                                }else{
                                    all = false;
                                }
                            } else if(['isEmpty', 'isFilled'].include(term.operator)) {
                                var selected = false;
                                var arr = $('input_'+term.field).options;
                                for(var i = 0; i < arr.length; i++) {
                                    if(!arr[i].value.empty() && arr[i].selected == true) {
                                        selected = true;
                                    }
                                }
                                if(term.operator == 'isEmpty' ) {
                                    if(!selected) any = true;
                                    else all = false;
                                }
                                if(term.operator == 'isFilled') {
                                    if(selected) any = true;
                                    else all = false;
                                }
                            }
                        } else {
                            value = $('input_'+term.field).value;
                            if(value === undefined){return;/* continue; */}
                            if(JotForm.checkValueByOperator(term.operator, term.value, value)){
                                any = true;
                            }else{
                                all = false;
                            }
                        }
                    break;
                    case "grading":
                        if (['isEmpty', 'isFilled'].include(term.operator)) {
                            filled = $$('input[id^=input_' + term.field +'_]').collect(function(e){ return e.value; }).any();
                            if(JotForm.checkValueByOperator(term.operator, term.value, filled)){
                                any = true;
                            }else{
                                all = false;
                            }
                        } else {
                            value = $('grade_point_' + term.field).innerHTML.stripTags();
                            if(JotForm.checkValueByOperator(term.operator, term.value, value)){
                                any = true;
                            }else{
                                all = false;
                            }
                        }
                    break;                    
                    default:
                        value = $('input_'+term.field).value;
                        if($('input_'+term.field).hinted){
                            value = "";
                        }
                        if(value === undefined){return;/* continue; */}
                        if(JotForm.checkValueByOperator(term.operator, term.value, value, term.field)){
                            any = true;
                        }else{
                            all = false;
                        }
                }
                
            }catch(e){ 
                JotForm.error(e);
            }
        });

        
        if(condition.type == 'field'){ // Field Condition
            // JotForm.log("any: %s, all: %s, link: %s", any, all, condition.link.toLowerCase());
            var isConditionValid = (condition.link.toLowerCase() == 'any' && any) || (condition.link.toLowerCase() == 'all' && all);
            condition.action.each(function(action) {
                if (isConditionValid) {
                    if (action.visibility.toLowerCase() == 'show'){
                        // JotForm.info('Correct: Show field: '+($('label_' + action.field) && $('label_' + action.field).innerHTML));
                        JotForm.showField(action.field);
                    } else {
                        // JotForm.info('Correct: Hide field: '+($('label_' + action.field) && $('label_' + action.field).innerHTML));
                        JotForm.hideField(action.field);
                    }
                } else {
                    if(action.visibility.toLowerCase() == 'show'){
                        // JotForm.info('Fail: Hide field: '+($('label_' + action.field) && $('label_' + action.field).innerHTML));
                        JotForm.hideField(action.field);
                    } else {
                        // JotForm.info('Fail: Show field: '+($('label_' + action.field) && $('label_' + action.field).innerHTML));
                        JotForm.showField(action.field);
                    }
                }
            });
        } else if(condition.type == 'require') {
            var isConditionValid = (condition.link.toLowerCase() == 'any' && any) || (condition.link.toLowerCase() == 'all' && all);
            condition.action.each(function(action) {
                if (isConditionValid) {
                    if (action.visibility.toLowerCase() == 'require'){
                        JotForm.requireField(action.field, true);
                    } else {
                        JotForm.requireField(action.field, false);
                    }
                } else {
                    if(action.visibility.toLowerCase() == 'require'){
                        JotForm.requireField(action.field, false);
                    } else {
                        JotForm.requireField(action.field, true);
                    }
                }
            });
        } else if(condition.type == 'calculation') {
            var calcs = JotForm.calculations;
            var cond = null;
            for(var i=0; i < calcs.length; i++) {
                if(calcs[i].conditionId === condition.id) {
                    calc = calcs[i];
                }
            }
            if((condition.link.toLowerCase() == 'any' && any) || (condition.link.toLowerCase() == 'all' && all)) {
                calc.conditionTrue = true;
                JotForm.checkCalculation(calc);
            } else {
                calc.conditionTrue = false;
                $('input_' + condition.action[0].resultField).value = '';
            }
        } else { // Page condition
        
            JotForm.log("any: %s, all: %s, link: %s", any, all, condition.link.toLowerCase());
            if (JotForm.nextPage) {
                return;
            }
            if((condition.link.toLowerCase() == 'any' && any) || (condition.link.toLowerCase() == 'all' && all)){
                var action = condition.action[0];
                JotForm.info('Correct: Skip To: ' + action.skipTo);
                var sections = $$('.form-section:not([id^=section_])');
                if(action.skipTo == 'end'){
                    JotForm.nextPage = sections[sections.length - 1];
                }else{
                    JotForm.nextPage = sections[parseInt(action.skipTo.replace('page-', ''), 10)-1];
                }
                
            }else{
                
                JotForm.info('Fail: Skip To: page-' + JotForm.currentPage + 1);
                
                JotForm.nextPage = false; 
            }
        }
        JotForm.enableDisableButtonsInMultiForms();
    },
    currentPage: false,
    nextPage: false,
    previousPage: false,
    fieldConditions: {},
    
    setFieldConditions: function(field, event, condition){
        if(!JotForm.fieldConditions[field]){
            JotForm.fieldConditions[field] = {
                event: event,
                conditions:[]
            };
        }
        JotForm.fieldConditions[field].conditions.push(condition);
    },

    widgetsAsCalculationOperands: [],

    /*
    * Require or Unrequire a field
    */
    requireField: function(qid, req) {

        if(!$('id_'+qid)) return;

        $$("#id_" + qid + ' input, textarea, select').each(function(el) {

            //get all validations
            var validations = [];
            if(el.className.indexOf('validate[') > -1) {
                validations = el.className.substr(el.className.indexOf('validate[') + 9);
                validations = validations.substr(0, validations.indexOf(']')).split(/\s*,\s*/);
            } else {
                validations = [];
            }

            //remove all validation from class
            el.className = el.className.replace(/validate\[.*\]/, '');

            //remove required from validations array
            for (var i=validations.length-1; i>=0; i--) {
                if (validations[i] === 'required') {
                    validations.splice(i, 1);
                }
            }

            if(req) {
                validations.push('required'); //add required to validations
            } else {
                el.removeClassName('form-validation-error')
            }

            //add validations back to class
            if(validations.length > 0) {
                el.addClassName('validate['+ validations.join(',') +']');
            }

            JotForm.setFieldValidation(el);
        });
        if(req) {
            if($('label_'+qid) && !$('label_'+qid).down('.form-required')) {
                $('label_'+qid).insert('<span class="form-required">*</span>');
            }
        } else {
            if($('label_'+qid) && $('label_'+qid).down('.form-required')) {
                $('label_'+qid).down('.form-required').remove();
            }

            //remove any existing errors
            if($("id_"+qid).down('.form-error-message')) {
                $("id_"+qid).down('.form-error-message').remove();
            }
            $("id_"+qid).removeClassName('form-line-error');
        }
    },

    /**
     * When widget value is updated check whether to trigger calculation
     */
    triggerWidgetCalculation: function(id) {
        if(JotForm.widgetsAsCalculationOperands.include(id)) { 
            if (document.createEvent) {
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent('change', true, true);
                $('input_' + id).dispatchEvent(evt);
            } else if ($('input_' + id).fireEvent) {
                return $('input_' + id).fireEvent('onchange');
            }
        }
    },

    
    setCalculationResultReadOnly: function() {
        $A(JotForm.calculations).each(function(calc, index) {
            if(calc.readOnly && $('input_' + calc.resultField) != null) {
                $('input_' + calc.resultField).setAttribute('readOnly', 'true');
            }
        });
    },

    setCalculationEvents: function() {

        var setCalculationListener = function(el, ev, calc) {
            $(el).observe(ev, function() {
                el.addClassName('calculatedOperand');
                JotForm.checkCalculation(calc);
            });
        };

        $A(JotForm.calculations).each(function(calc, index) {

            var ops = calc.operands.split(',');
            for(var i = 0; i < ops.length; i++) {
                
                var opField = ops[i];
                if(!opField || opField.empty() || !$('id_' + opField)) continue;

                var type = JotForm.getInputType(opField),
                    ev;
                switch (type) {
                    case "widget":
                        setCalculationListener($('id_' + opField), 'change', calc);
                        JotForm.widgetsAsCalculationOperands.push(opField);
                        break;
                        
                    case 'radio':
                    case 'checkbox':
                        setCalculationListener($('id_' + opField), 'click', calc);
                        break;
                    
                    case 'select':
                    case 'file':
                        setCalculationListener($('id_' + opField), 'change', calc);
                        break;
                    
                    case 'datetime':
                        setCalculationListener($('id_' + opField), 'date:changed', calc);
                        $$("#id_" + opField + ' select').each(function(el) {
                            setCalculationListener($(el), 'change', calc);
                        });
                        break;
                    
                    case 'time':
                    case 'birthdate':
                        $$("#id_" + opField + ' select').each(function(el) {
                            setCalculationListener($(el), 'change', calc, index);
                        });                        
                        break;

                    case 'address':
                        setCalculationListener($('id_' + opField), 'keyup', calc, index);
                        $$("#id_" + opField + ' select').each(function(el) {
                            setCalculationListener($(el), 'change', calc, index);
                        });
                        break;

                    case 'number':
                        setCalculationListener($('id_' + opField), 'keyup', calc, index);
                        setCalculationListener($('id_' + opField), 'click', calc, index);
                        break;

                    default:
                        setCalculationListener($('id_' + opField), 'keyup', calc, index);
                        break;
                }
            }
        });
    },

    calcValues: [],

    setCalculationValues: function(calculationValues, id) {
        JotForm.calcValues[id] = calculationValues.split('|');
    },

    runCalculationsOnLoad:function() {
        $A(JotForm.calculations).each(function(calc, index) {
            if(!calc.showBeforeInput) {
                JotForm.checkCalculation(calc);
            }
        });
    },

    checkCalculation: function(calc) {
        if(calc.hasOwnProperty('conditionTrue') && !calc.conditionTrue) {
            return '';
        }

        var result = calc.resultField,
            showBeforeInput = calc.showBeforeInput;

        if(!$('input_' + result)) return;

        var getValue = function(data, numeric) {

            if(!$('id_' + data)) return '';
            if(!$('id_' + data).hasClassName('calculatedOperand') && showBeforeInput) return ''; //no input yet so ignore field

            var type = JotForm.getInputType(data);
            var val ='';
            switch (type) {
                case 'radio':
                    $$("#id_" + data + ' input[type="radio"]').each(function(rad, i) {
                        if(rad.checked) {
                            //grab calculation value
                            if(JotForm.calcValues[data] && i < JotForm.calcValues[data].length) {
                                val = JotForm.calcValues[data][i];
                            } else {
                                val = rad.value;
                            }
                        }
                    });
                    break;

                case 'checkbox':

                    var valArr = [];
                    $$("#id_" + data + ' input[type="checkbox"]').each(function(chk, i) {
                        if(chk.checked) {
                            if(JotForm.calcValues[data] && i < JotForm.calcValues[data].length) { //use calculation value instead of option
                                valArr.push(JotForm.calcValues[data][i]);
                            } else {
                                valArr.push(chk.value);
                            }
                        }
                    });

                    if(numeric) { 
                        val = valArr.inject(0, function(accum, thisVal) { 
                            return accum + (parseFloat(thisVal.replace(/-?([^0-9])/g,"$1").replace(/[^0-9\.-]/g,"")) || 0); 
                        });
                    } else {
                        val = valArr.join();
                    }
                    break;

                case 'select':
                    //grab calculation value
                    if(JotForm.calcValues[data] && $('input_' + data).selectedIndex < JotForm.calcValues[data].length) {
                        val = JotForm.calcValues[data][$('input_' + data).selectedIndex];
                    } else {
                        val = $('input_' + data).value;
                    }
                    break;

                case 'number':
                    if($$("#id_" + data + ' input[type="number"]').length > 1) { //ranges
                        var valArr = [];
                        $$("#id_" + data + ' input[type="number"]').each(function(el) { 
                            valArr.push(el.value);
                        });
                        val = valArr.join(' ');
                    } else {
                        if(!$('input_' + data).value.empty()) {
                            val = parseFloat($('input_' + data).value);
                        }
                    }
                    break;

                case 'combined':
                case 'grading':
                    var valArr = [];
                    $$("#id_" + data + ' input[type="text"]').each(function(el) {
                        if(!el.value.empty()) valArr.push(el.value);
                    });
                    $$("#id_" + data + ' input[type="tel"]').each(function(el) {
                        if(!el.value.empty()) valArr.push(el.value);
                    });
                    val = valArr.join(' ');
                    break;

                case 'datetime':
                    var valArr = [];
                    if(numeric) {
                        valArr.push($("month_" + data).value);
                        valArr.push($("day_" + data).value);
                        valArr.push($("year_" + data).value);
                    } else {
                        $$("#id_" + data + ' input[type="tel"]').each(function(el) {
                            valArr.push(el.value);
                        });
                    }
                    
                    $$("#id_" + data + ' select').each(function(el) {
                        valArr.push(el.value);
                    });

                    //if numeric calculation calculate the number of days in epoch
                    if(numeric) {
                        var hours = mins = ampm = '';
                        if(valArr.length > 4 && !valArr[3].empty() && !valArr[4].empty()) {
                            hours = parseInt(valArr[3]);
                            //convert to 24hours
                            if(valArr.length == 6 && !valArr[5].empty()) {
                                ampm = valArr[5];
                                if(ampm == 'PM' && hours != 12) {
                                    hours += 12;
                                } else if(ampm == 'AM' && hours == 12) { 
                                    hours = 0;
                                }
                            }
                            mins = valArr[4];
                        }
                        var millis = new Date(valArr[2], valArr[0]-1, valArr[1], hours, mins).getTime();
                        val = millis/60/60/24/1000;
                    } else {
                        if(valArr.length > 2 && !valArr[0].empty() && !valArr[1].empty() && !valArr[0].empty()) {
                            val = valArr[0] + '/' + valArr[1] + '/' + valArr[2];
                        }
                        if(valArr.length > 4 && !valArr[3].empty() && !valArr[4].empty()) {
                            val += ' ' + valArr[3] + ':' + valArr[4]; 
                            if(valArr.length == 6 && !valArr[5].empty()) val += ' ' + valArr[5]; //ampm
                        }
                    }

                    break;

                case 'time':
                    var valArr = [];
                    $$("#id_" + data + ' select').each(function(el) {
                        valArr.push(el.value);
                    });
                    if(numeric) {
                        var hour, mins, ampm = '';
                        hours = parseInt(valArr[0]);
                        if(valArr.length == 3 && !valArr[2].empty()) {
                            ampm = valArr[2];
                            if(ampm == 'PM' && hours != 12) {
                                hours += 12;
                            } else if(ampm == 'AM' && hours == 12) { 
                                hours = 0;
                            }
                        }
                        mins = valArr[1];
                        var date = new Date();
                        var millis = new Date(date.getFullYear(), date.getMonth(), date.getDay(), hours, mins).getTime();
                        val = millis/60/60/1000;
                    } else {
                        if(!valArr[0].empty() && !valArr[1].empty()) {
                            val = valArr[0] + ':' + valArr[1];
                            if(valArr.length > 2 && !valArr[2].empty()) val += ' ' + valArr[2];
                        }
                    }
                    break;

                case 'birthdate':
                    var valArr = [];
                    $$("#id_" + data + ' select').each(function(el) {
                        valArr.push(el.value);
                    });
                    if(!valArr[0].empty() && !valArr[1].empty() && !valArr[2].empty()) {
                        val = valArr[0] + ' ' + valArr[1] + ' ' + valArr[2];
                    } 
                    break;

                case 'address':
                    var valArr = [];
                    $$("#id_" + data + ' input[type="text"]').each(function(el) {
                        if(!el.value.empty()) valArr.push(el.value);
                    });
                    $$("#id_" + data + ' select').each(function(el) {
                        if(!el.value.empty()) valArr.push(el.value);
                    });
                    val = valArr.join(', ');
                    break;

                case 'file':
                    val = $('input_' + data).value;
                    val = val.substring(val.lastIndexOf("\\") + 1);
                    break;

                default:
                    if($('input_' + data) && typeof $('input_' + data).value !== 'undefined') {
                        val = $('input_' + data).value;
                    }
                    break;
            }

            if(numeric && typeof val !== 'number') {
                val = val.replace(/-?([^0-9])/g,"$1").replace(/[^0-9\.-]/g,"");
                if(val < 0) { //ntw 343248 - this is to patch a weirdness in the parser whereby x+-y will not parse
                    val = '(' + val + ')';
                }
            }

            if(numeric && val==='') {
                val = 0;
            }

            return val;
        };

        var calculate = function(equation, numeric) {
            var out = '';
            var acceptableFunctions = {"abs":Math.abs,"acos":Math.acos,"acosh":Math.acosh,"asin":Math.asin,"asinh":Math.asinh,"atan":Math.atan,
                    "atanh":Math.atanh,"atan2":Math.atan2,"cbrt":Math.cbrt,"ceil":Math.ceil,"cos":Math.cos,"cosh":Math.cosh,"exp":Math.exp,"expm1":Math.expm1,
                    "floor":Math.floor,"fround":Math.fround,"hypot":Math.hypot,"imul":Math.imul,"log":Math.log,"log1p":Math.log1p,"log10":Math.log10,
                    "log2":Math.log2,"max":Math.max,"min":Math.min,"pow":Math.pow,"random":Math.random,"round":Math.round,"sign":Math.sign,"sin":Math.sin,
                    "sinh":Math.sinh,"sqrt":Math.sqrt,"tan":Math.tan,"tanh":Math.tanh,"toSource":Math.toSource,"trunc":Math.trunc,"E":Math.E,"LN2":Math.LN2,
                    "LN10":Math.LN10,"LOG2E":Math.LOG2E,"LOG10E":Math.LOG10E,"PI":Math.PI,"SQRT1_2":Math.SQRT1_2,"SQRT2":Math.SQRT2};             
            for(var i = 0; i < equation.length; i++) {

                character = equation.charAt(i);

                if(character === '[' && !numeric) {
                    var end = equation.indexOf(']', i);
                    try {
                        var num = calculate(equation.substring(i+1, end), true);
                        if(num) {
                            num = new MathProcessor().parse(num);
                            num = num.toFixed(calc.decimalPlaces);
                            if(!calc.showEmptyDecimals) {
                                num = parseFloat(num);
                            }
                            if(!isFinite(num)) {
                                num = 0;
                            }
                            out += num;
                        }
                    } catch(e) {
                        console.log('equation error');
                    }
                    i = end;
                } else if(equation.substr(i, 3) === '|*|') {
                    try {
                        i+=3;
                        var end = equation.indexOf('|*|', i);
                        if(end === -1) continue;
                        var specOp = equation.substring(i, end);
                        i += end+2-i;
                        if(equation.charAt(i+1) === '(' || (equation.charAt(i+1) === '[' && equation.charAt(i+2) === '(')) {
                            i += (equation.charAt(i+1) === '[') ? 3 : 2;
                            var endSpecial = -1;
                            var balance = 1;
                            for(var k=i;k<equation.length;k++) {
                                if(equation.charAt(k) === ')') {
                                    balance--;
                                    if(balance === 0) {
                                        endSpecial = k;
                                        break;
                                    }
                                } else if(equation.charAt(k) === '(') {
                                    balance++;
                                }
                            }

                            if(endSpecial === -1) continue;
                            var args = equation.substring(i, endSpecial);
                            args = args.split(',');
                            for(var j=0;j<args.length;j++) {
                                args[j] = calculate(args[j], true);
                                if(args[j]) {
                                    args[j] = new MathProcessor().parse(args[j]);
                                }
                            }
                            i += endSpecial-i;
                            if(specOp === 'dateString') {
                                out += new Date(args[0]*24*60*60*1000).toDateString();
                                if(equation.charAt(i) === ']') {
                                    i++;
                                } else {
                                    equation = equation.substr(0, i+1) + '[' + equation.substr(i+1);
                                }
                            } else {
                                out += acceptableFunctions[specOp].apply(undefined, args);
                            }
                            
                        } else if(specOp === 'random') {
                            out += Math.random();
                        } else {
                            out += acceptableFunctions[specOp];
                        }
                    } catch(e) {
                        console.log(e);
                    }
                } else if(character === '{') {
                    var end = equation.indexOf('}', i);
                    var qid = equation.substring(i+1, end);
                    var val = getValue(qid, numeric);
                    if(val === '' && numeric) return false;
                    out += val;
                    
                    i += end-i;
                } else {
                    out += character;
                }
            }
            return out;
        };
        
        var output = calculate(calc.equation);
        if(parseFloat(output) === 0 && JotForm.defaultValues['input_' + result]) {
            output = JotForm.defaultValues['input_' + result]; 
        }
        $('input_' + result).value = output;

        if (document.createEvent) {
            var evt = document.createEvent('HTMLEvents');
            evt.initEvent('keyup', true, true);
            $('input_' + result).dispatchEvent(evt);
        }
        if ($('input_' + result).fireEvent) {
            $('input_' + result).fireEvent('onkeyup');
        }
    },

    widgetsWithConditions: [],

    /**
     * When widget value is updated check whether to trigger conditions
     */
    triggerWidgetCondition: function(id) { 
        if(JotForm.widgetsWithConditions.include(id)) { 
            if (document.createEvent) {
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent('change', true, true);
                $('input_' + id).dispatchEvent(evt);
            } else if ($('input_' + id).fireEvent) {
                return $('input_' + id).fireEvent('onchange');
            }
        }
    },

    /**
     * Sets all events and actions for form conditions
     */
    setConditionEvents: function(){
        try {
            $A(JotForm.conditions).each(function(condition){

                if(condition.disabled == true) return; //go to next condition

                if (condition.type == 'field' || condition.type == 'calculation' || condition.type == 'require') {
                    
                    // Loop through all rules
                    $A(condition.terms).each(function(term){
                        var id = term.field;

                        switch (JotForm.getInputType(id)) {
                            case "widget":
                                JotForm.setFieldConditions('input_' + id, 'change', condition);
                                JotForm.widgetsWithConditions.push(id);
                        break;
                            case "combined":
                                JotForm.setFieldConditions('id_' + id, 'keyup', condition);
                            break;
                            case "address":
                                JotForm.setFieldConditions('id_' + id, 'keyup', condition);
                                JotForm.setFieldConditions('input_'+term.field+'_country', 'change', condition);
                            break;
                            case "datetime":
                                JotForm.setFieldConditions('id_' + id, 'date:changed', condition);
                            break;
                            case "birthdate":
                                JotForm.setFieldConditions('input_'+id+'_day', 'change', condition);
                                JotForm.setFieldConditions('input_'+id+'_month', 'change', condition);
                                JotForm.setFieldConditions('input_'+id+'_year', 'change', condition);
                            break;
                            case "time":
                                JotForm.setFieldConditions('input_'+id+'_hourSelect', 'change', condition);
                                JotForm.setFieldConditions('input_'+id+'_minuteSelect', 'change', condition);
                                JotForm.setFieldConditions('input_'+id+'_ampm', 'change', condition);
                            case "select":
                            case "file":
                                JotForm.setFieldConditions('input_' + id, 'change', condition);
                                break;
                            case "checkbox":
                            case "radio":
                                JotForm.setFieldConditions('id_' + id, 'click', condition);
                                break;
                            case "number":
                                JotForm.setFieldConditions('input_' + id, 'number', condition);
                                break;
                            case "autocomplete": // Neil: Set custom event for autocomplete fields (classname: "form-autocomplete")
                                JotForm.setFieldConditions('input_' + id, 'autocomplete', condition);
                                break;
                            case "grading":
                                JotForm.setFieldConditions('id_' + id, 'keyup', condition);
                                break;
                            default: // text, textarea, dropdown
                                JotForm.setFieldConditions('input_' + id, 'keyup', condition);
                        }
                    });
                    
                } else {
                    $A(condition.terms).each(function(term){
                        var id = term.field;
                        
                        // if this is a product quantity option (e.g. 4_quantity_1009_0)
                        if (term.field.indexOf("_") !== -1) {
                            // get ID (4)
                            id = term.field.split("_")[0];
                        }
                        
                        var nextButton = JotForm.getSection($('id_' + id)).select('.form-pagebreak-next')[0];
                        if (!nextButton) {
                            return;
                        }
                        
                        nextButton.observe('mousedown', function(){
                            // JotForm.warn('Checking ' + $('label_' + id).innerHTML.strip());
                            JotForm.checkCondition(condition);
                        });
                    });
                }
            });
            
            $H(JotForm.fieldConditions).each(function(pair){
                var field = pair.key;
                var event = pair.value.event;
                var conds = pair.value.conditions;
                
                // JotForm.info("Has Condition:", field, $(field));
                // If field is not found then continue
                if(!$(field)){ return; }
                if(event == "autocomplete"){ // if event type is trigger by autocomplete, listen to blur and keyup events
                    $(field).observe('blur', function(){
                        $A(conds).each(function(cond){
                            JotForm.checkCondition(cond);
                        });
                        }).run('blur');
                    $(field).observe('keyup', function(){
                        $A(conds).each(function(cond){
                            JotForm.checkCondition(cond);
                        });
                        }).run('keyup');
                } else if(event == "number") {
                    $(field).observe('change', function(){
                        $A(conds).each(function(cond){
                            JotForm.checkCondition(cond);
                        });
                        }).run('change');
                    $(field).observe('keyup', function(){
                        $A(conds).each(function(cond){
                            JotForm.checkCondition(cond);
                        });
                    }).run('keyup'); 
                }
                else {
                $(field).observe(event, function(){
                    $A(conds).each(function(cond){
                        //Emre: phone condition does not work (65639)
                        //var idf = field.replace(/.*_(\d+)/gim, '$1'); if field is "input_3_area", result is "3_area"
                        var idf = field.replace(/[^0-9]/gim, ''); 
                        // JotForm.warn('Checking ' + $('label_' + idf).innerHTML.strip(), ", Field Type: "+JotForm.getInputType(idf));
                        JotForm.checkCondition(cond);
                    });
                }).run(event);
            }
            });
        }catch(e){ 
            JotForm.error(e); 
        }
    },
    
    /**
     * Handles the payment subproducts behavior
     */
    
    handlePaymentSubProducts: function(){
        
        var heights = [];
        var optionValues = [];
        
        $$('.form-product-has-subproducts').each(function(sp){
            heights[sp.id] = [sp.parentNode.getHeight(), $$('label[for="' + sp.id + '"]')[0].getHeight()];
            showSubProducts(sp);
            sp.observe('click', function(){
                showSubProducts(this);
            });
        });
        
        function showSubProducts(el){
            
            var productSpan = el.parentNode;
            
            if(!el.checked){
                productSpan.shift({
                    height: heights[el.id][1],
                    duration: 0.3
                });
                // clear the values array
                optionValues[el.id] = [];
                
                $$('#' + el.id + '_subproducts select,' + '#' + el.id + '_subproducts input[type="text"]').each(function(field, i){
                    // capture the values
                    var fieldValue = field.tagName === "select" ? field.getSelected().value : field.value;
                    if(fieldValue){
                        optionValues[el.id].push([field.id, fieldValue]);
                    }
                    // clear values
                    if(field.tagName === "SELECT"){
                        field.selectedIndex = 0;
            } else {
                        field.value = 0;
                    }
                });
            } else {
                productSpan.shift({
                    height: heights[el.id][0]-10,
                    duration: 0.3
                });
                // populate values
                if(optionValues[el.id] && optionValues[el.id].length > 0){
                    optionValues[el.id].each(function(vv){
                        if($(vv[0]).tagName === "SELECT"){
                            $(vv[0]).selectOption(vv[1]);
                            $(vv[0]).triggerEvent('change');
                        } else {
                            $(vv[0]).value = vv[1];
                            // trigger keyup event to begin calculation
                            $(vv[0]).triggerEvent('keyup');
            }
                    });
                }
            }
            JotForm.countTotal();
        };
    },
    /**
     * Calculates the payment total with quantites
     * @param {Object} prices
     */
    countTotal: function(prices){
        var prices = prices || JotForm.prices;
        var discounted = false;
        // If a coupon is entered and verified
        if(Object.keys(JotForm.discounts).length > 0) {
            discounted = true;
            // if this is a discount for order total
            if(JotForm.discounts.total) {
                var type  = JotForm.discounts.type,
                    rate  = JotForm.discounts.rate,
                    minimum = JotForm.discounts.minimum,
                    code = JotForm.discounts.code;
                
            } else {
                // If for products
                for(var pid in prices) {
                    for(var kkey in JotForm.discounts) {
                        if(pid.indexOf(kkey)!== -1) {
                            prices[pid].discount = JotForm.discounts[kkey];
                        } 
                    }
                }
            }
        } else {
            $H(prices).each(function(p){
                delete prices[p.key].discount;
            });
        }
        
        var total = 0;          // total for the whole payment field
        var subTotal = 0;       // subtotal for all items selected, excluding shipping or taxes
        var itemSubTotal = [];  // subtotal for a group of subproducts
        var shippingTotal = 0;  // total shipping cost
        var taxTotal = 0;       // total tax cost
        var taxRate = 0;        // uniform tax rate (percentage) for the non-exempted products
        
        $H(prices).each(function(pair){
            total = parseFloat(total);
            var productShipping = 0;                    // shipping cost for current product
            var price = parseFloat(pair.value.price);   // price for the individual product
            var taxAmount = 0;                          // tax amount for the individual product
            var subproduct = false;                     // is this a subproduct?
            var parentProductKey;                       // subproduct's parent key (see http://www.jotform.com/help/264-Create-Sub-Products-Based-on-a-Product-Option)
            
            // get the parent product id if this is a subproduct
            if (pair.key.split('_').length === 4) {
                subproduct = true;
                // get the parent product key/id
                parentProductKey = pair.key.split('_');
                parentProductKey.pop();
                parentProductKey = parentProductKey.join("_");
                // initalize item subtotal for this subproduct group
                itemSubTotal[parentProductKey] = itemSubTotal[parentProductKey] || 0;
            } else {
                parentProductKey = pair.key;
            }
            
            // if product has special pricing, use selected option's corresponding price
            if ($(pair.value.specialPriceField)) { 
                var specialPriceField = $(pair.value.specialPriceField);
                // if this special priced product option is expanded
                // Note: expanded options are inserted on the form as hidden input fields
                if(pair.value.child && pair.value.specialPriceField.split("_").length === 4){
                    var idx = pair.value.specialPriceField.split("_")[3];
                    price = parseFloat(pair.value.specialPriceList[idx]);
                } else {
                    price = parseFloat(pair.value.specialPriceList[specialPriceField.getSelected().index]);
                    if($(pair.key + '_price')) {
                        $(pair.key + '_price').siblings('.freeCurr').each(function(el) { el.style.display = 'inline';});
                    }
                }
            }
            // If there is a coupon, apply the discount rate to the price
            if (pair.value.discount) {
                var discount = pair.value.discount;
                var dc = discount.split('-');
                price = price - ( ( dc[1] == 'fixed' ) ? dc[0] : price * ( dc[0] / 100 ) );
                price = price < 0 ? 0 : price;
            }
            // If there is no setup fee, update the price
            if ( !pair.value.recurring ) {
                var priceText = $(pair.key + '_price') ?  $(pair.key + '_price') : $(pair.key.replace(pair.key.substring(pair.key.lastIndexOf("_")), "") + '_price') || null;
                if(priceText){
                    var oldPriceText = priceText.innerHTML;
                    if(pair.value.price === "0"){
                        $(priceText).update(' Free');
//                        priceText.siblings('.freeCurr').each(function(el) { el.style.display = 'none';});
                    } else {
                        $(priceText).update(parseFloat(price).toFixed(2));
                    }
                    if(oldPriceText !== priceText.innerHTML) {
                        // JotForm.createTooltip($(priceText), '<p style="text-decoration:strikethrough">' + oldPriceText + '</p>');
                    }
                }
            }
            
            // If there is a tax, get the total tax rate including location surcharges
            if(pair.value.tax && pair.value.tax.rate > 0) {
                var tax = pair.value.tax;
                taxRate = parseFloat(tax.rate);
                // if location surcharge field exists and there is a selected value, get the corresponding surcharge value
                if($$('select[id*="input_' + tax.surcharge.field + '"]').length > 0 && $$('select[id*="input_' + tax.surcharge.field + '"]')[0].getSelected().value){
                    var selectedIndex = $$('select[id*="input_' + tax.surcharge.field + '"]')[0].getSelected().index - 1; // we subtract 1 to the index because the first index has empty value
                    taxRate += parseFloat(tax.surcharge.rates[selectedIndex]);
                }
            }
                    
            if ($(pair.key).checked) {
                if ($(pair.value.quantityField) || $(pair.value.specialPriceField)) {
                    //if there is a quantity option and special pricing isn't based on it
                    if ($(pair.value.quantityField) && (pair.value.specialPriceField !== pair.value.quantityField)) {
                    // use different calculation method for custom quantity (textbox) option
                        if($(pair.value.quantityField).readAttribute('type') == "text") {
                            price = $(pair.value.quantityField).value ? price * Math.abs(parseInt($(pair.value.quantityField).value, 10)) : 0;
                        }
                        else {
                            price = price * parseInt(($(pair.value.quantityField).getSelected().text || 0 ) , 10);
                        }
                    }
                    
                    // if this is a subproduct, add the price to the subtotal
                    if (subproduct) {
                        itemSubTotal[parentProductKey] += price;
                    }
                    
                    // update item subtotal if available
                    if ($(parentProductKey  + '_item_subtotal') && !isNaN(price)) {
                        if (!subproduct) {
                            $(parentProductKey+ '_item_subtotal').update(parseFloat(price).toFixed(2)); 
                        } else {
                            $(parentProductKey+ '_item_subtotal').update(parseFloat(itemSubTotal[parentProductKey]).toFixed(2)); 
                        }
                    }
                    
                }
                
                // if this product is taxed, calculate the tax amount
                if (pair.value.tax) {
                    taxAmount = price * (taxRate/100);
                }
                // add shipping if it is available
                if (pair.value.shipping && pair.value.shipping.firstItem) {
                    var shipping = pair.value.shipping;
                    var qty = $(pair.value.quantityField) ? ($(pair.value.quantityField).readAttribute('type') === "text" ? parseInt($(pair.value.quantityField).value) : parseInt($(pair.value.quantityField).getSelected().text || 0)) : 1;
                    if (qty === 1){
                        productShipping = parseFloat(shipping.firstItem);
                    } 
                    if (qty > 1 ) {
                        productShipping = !parseFloat(shipping.addItem) ? parseFloat(shipping.firstItem) : parseFloat(shipping.firstItem) + parseFloat(shipping.addItem) * (qty -1);
                    }
                }
                taxTotal += taxAmount; // accummulate tax amounts for each product
                shippingTotal += productShipping;  // accumulate shipping total
                subTotal += price; // accumulate total for all items, without shipping/discount/tax
                total += price + productShipping + taxAmount;   // overall total
                
            } else {
                if ($(pair.key + '_item_subtotal') || isNaN(price)) {
                    $(pair.key + '_item_subtotal').update("0.00"); 
                }
            }
        });
        
        if (total === 0 || isNaN(total)) {
            total = "0.00";
        }
        if ($('coupon-button')) {
            var couponInput = $($('coupon-button').getAttribute('data-qid') + '_coupon');
        }
        if (JotForm.discounts.total) {
            if(total >= minimum) {
                var reduce = type === "fixed" ? rate : (rate / 100) * parseFloat(total);
                total = total > reduce ? total - reduce : 0 ;
                couponInput.value = code;
            } else {
                reduce = 0;
                // clear (hidden) coupon input if total is less than required minimum 
                couponInput.value = '';
            }
            // insert discount indicator
            $$('.form-payment-total')[0].insert({'top':JotForm.discounts.container});
            $('discount_total').update(parseFloat(reduce).toFixed(2));
        }
        // assign total to global var;
        this.paymentTotal = Number(total);
        // for PaypalPro only
        if($('creditCardTable')){
            // if total is zero and a valid coupon has been entered
            if(this.paymentTotal === 0 && discounted ){
                $('creditCardTable').hide();
            } else if($$('input[id*="paymentType_credit"]')[0].checked){
                $('creditCardTable').show();
            }
        }
        // update payment subtotal
        if ($("payment_subtotal")){
            $("payment_subtotal").update(parseFloat(subTotal).toFixed(2));
        }
        // update tax figures
        if ($("payment_tax")){
            $("payment_tax").update(parseFloat(taxTotal).toFixed(2));
            $("payment_tax_rate").update('(' + parseFloat(taxRate) + '%)');
            $$("input[name='tax']")[0].value = parseFloat(taxTotal).toFixed(2);
        }
        // update shipping cost total
        if ($("payment_shipping")){
            $("payment_shipping").update(parseFloat(shippingTotal).toFixed(2));
        }
        // update overall total
        if ($("payment_total")) {
            $("payment_total").update(parseFloat(total).toFixed(2));
        }
    },
    prices: {},
    /**
     * Sets the events for dynamic total calculation
     * @param {Object} prices
     */
    totalCounter: function(prices){
        // Assign form's initial prices to JotForm.prices object
        // so we can use it later
        JotForm.prices = prices;
        // count total price upon loading the form (Bug:168425)
        document.observe('dom:loaded',JotForm.countTotal(prices));
        $H(prices).each(function(pair){
            $(pair.key).observe('click', function(){
                JotForm.countTotal(prices);
            });
            // if tax is present
            if (pair.value.tax) {
                var surcharge = pair.value.tax.surcharge;
                // observe change event for surcharge location field
                if ($$('select[id*="input_' + surcharge.field + '"]').length > 0) {
                    $$('select[id*="input_' + surcharge.field + '"]')[0].observe('change',function(){
                        JotForm.countTotal();
                    });
                }
            }
            
            if ($(pair.value.quantityField)) {
                function countQuantityTotal(){
                        if(JotForm.isVisible($(pair.value.quantityField))){
                            // Neil: temporary fix for 287973
                            // because we run the change event for quantity upon loading (to evaluate the conditions), 
                            // the associated product checkbox should not change if quantity did not change value
                            if($(pair.value.quantityField).tagName !== 'SELECT' ||  $(pair.value.quantityField).getSelected().index > 0){
                                $(pair.key).checked = !($(pair.value.quantityField).getValue() <= 0) ? true : false;
                            }
                            JotForm.countTotal(prices);
                        }
                    }

                var triggerAssociatedElement = function(el) {
                    var prodID = $(el).id.match(/input_([0-9]*)_quantity_/);
                    setTimeout(function() {
                        if(prodID && $('id_' + prodID[1])) {
                            $('id_' + prodID[1]).triggerEvent('click');
                        }
                    }, 100);
                };

                $(pair.value.quantityField).observe('change', function(){
                    setTimeout(countQuantityTotal,50);
                    triggerAssociatedElement(this);

                });
                // calculate total for custom quantity (text box)
                $(pair.value.quantityField).observe('keyup', function(){
                    setTimeout(countQuantityTotal,50);
                    triggerAssociatedElement(this);
                });
            }
            if ($(pair.value.specialPriceField)) {
                function countSpecialTotal(){
                        if(JotForm.isVisible($(pair.value.specialPriceField))){
                            // because we run the change event for quantity upon loading (to evaluate the conditions), 
                            // the associated product checkbox should not change if quantity did not change value
                            if($(pair.value.specialPriceField).tagName !== 'SELECT' ||  $(pair.value.specialPriceField).getSelected().index > 0){
                                $(pair.key).checked = true;
                            }
                            JotForm.countTotal(prices);
                        }
                    }
                $(pair.value.specialPriceField).observe('change', function(){
                    setTimeout(countSpecialTotal,50);
                });
                $(pair.value.specialPriceField).observe('keyup', function(){
                    setTimeout(countSpecialTotal,50);
                });
            }
        });
    },
    
    /**
     * Holds discount rates from verified coupon codes 
     */
    discounts: {},
    
    /**
     * Handles payment coupon code verification
     */
    
    checkCoupon: function() {
        JotForm.countTotal(JotForm.prices);
        if($('coupon-button')) {
            var cb = $('coupon-button'),
                cl = $('coupon-loader'),
                cm = $('coupon-message'),
                ci = $('coupon-input');
            
            var formID = $$('input[name="formID"]')[0].value;
            // prevent enter from submitting the form on coupon input
            ci.observe('keypress', function(e) {
                if(e.keyCode == "13") {
                    e.preventDefault();
                    cb.click();
                    ci.blur();
                }
            });
            
            // reset coupon inputs
            ci.enable();
            $$('input[name="coupon"]')[0].value = "";
            
            // verify the coupon on click
            cb.observe('click', function (){
                if (ci.value) {
                    cb.hide();
                    cl.show();
                    ci.value = ci.value.replace(/\s/g, "");
                    cb.disable();
                    var a = new Ajax.Jsonp(JotForm.server, {
                        parameters: {
                            action: 'checkCoupon',
                            coupon: ci.value,
                            formID: formID
                        },
                        evalJSON: 'force',
                        onComplete: function(t){
                            t = t.responseJSON || t;
                            if (t.success) {
                                if (t.message.indexOf('{') === -1) {
                                    if(t.message === "expired"){
                                        cm.innerHTML = "Coupon is expired. Please try another one.";
                                    } else {
                                        cm.innerHTML = "Coupon is invalid. Please try another one.";
                                    }
                                    ci.select();
                                    cl.hide();
                                    cb.show();
                                    cb.enable();
                                } else {
                                    cl.hide();
                                    cb.show();
                                    cm.innerHTML = "Coupon is valid.";
                                    JotForm.applyCoupon(t.message);
                                }
                            }
                        }
                    });
                } else {
                    $('coupon-message').innerHTML = "Please enter a coupon.";
                }
            });
        }
    },
    /** 
     *  Applies coupon to prices on the front-end
     *  @param {Object} discount
     */
    
    applyCoupon: function(discount) {
        discount = JSON.parse(discount);
        JotForm.discounts = {};
        
        var cb = $('coupon-button'),
            cl = $('coupon-loader'),
            cm = $('coupon-message'),
            ci = $('coupon-input'),
            cf = $(cb.getAttribute('data-qid') + '_coupon'); // Hidden input for passing coupon to server (submit)
        cb.stopObserving('click');
        if(cf){
            cf.value = discount.code;
        }
        cb.enable();
        ci.disable();
        cb.innerHTML = "Change";
        // When 'Change' button is clicked
        cb.observe('click', function(){
            // Clear hidden coupon input value
            cf.value = '';
            // Remove all original prices
            oldPrice.each(function(op){
                op.remove();
            });
            // Remove "Discount" indicator container if present
            if(JotForm.discounts.container){
                JotForm.discounts.container.remove();
            }
            //
            $$('span[id*="_price"]').each(function(field, id){                
                $(field).removeClassName('underlined');
            });
            // clear discounts object
            JotForm.discounts = {};
            cb.stopObserving('click');
            cm.innerHTML = "";
            cb.innerHTML = "Apply";
            ci.enable();
            ci.select();
            JotForm.checkCoupon();
        });
        var pair = [], oldPrice = [];
        // if this is a discount for product/s
        if(discount.apply == "product") {
            if(discount.products.include('all')){
                discount.products = [];
                for(var key in productID) {
                    discount.products.push(productID[key].slice(-4));
                }
            }

            $A(discount.products).each(function(pid){
                JotForm.discounts[pid] = discount.rate + '-' + discount.type;
                $$('span[id*="_price"]').each(function(field, id){
                    if(field.id.indexOf(pid) > -1){
                        $(field).addClassName('underlined');
                    }
                });
                
                if($$('label[for*="' + pid + '"] span.form-product-details b')[0]){
                    var priceContainer = $$('label[for*="' + pid + '"] span.form-product-details b')[0];
                    /*  The original price will be decreased by countTotal
                     *  The lines below will copy the unmodified original price and insert it before 
                     *  the discounted price
                     */ 
                    oldPrice[pid] = new Element('span');
                    var span = new Element('span', {style: 'text-decoration:line-through'});
                    span.insert(priceContainer.innerHTML.replace("price", "price_old"));
                    oldPrice[pid].insert({top: '&nbsp'});
                    oldPrice[pid].insert(span);
                    oldPrice[pid].insert({bottom: '&nbsp'});
                    priceContainer.insert({top: oldPrice[pid]}); 
                }
            });
        } else {
            var discountHTML = $$('.form-payment-total')[0].innerHTML.replace('Total:','Discount:').replace('payment_total','discount_total').replace('<span>','<span> - ');
            // if this is a discount for the order total
            // add discount properties to JotForm.discounts 
            // to be evaluated by countTotal
            JotForm.discounts = {
                total: true,
                code: discount.code,
                minimum: discount.minimum,
                type: discount.type,
                rate: discount.rate,
                container : new Element('span').insert(discountHTML + '<br><br>').setStyle({fontSize:'10px'})
            }
        }
        
        
        // call countTotal to update the prices
        JotForm.countTotal(JotForm.prices);
    },

    /**
     * Properly sets the public key for Stripe if any
     */
    setStripeSettings: function( pubkey, add_qid )
    {
        //check if the Stripe v1 library is loaded
        if (
            (pubkey || add_qid) && typeof Stripe === 'function' &&
            typeof Stripe.setPublishableKey === 'function' &&
            typeof _StripeValidation === 'function'
        )
        {
            var clean_pubkey = pubkey.replace(/\s+/g, '');
            Stripe.setPublishableKey( clean_pubkey );

            //set the validation
            var stripeV = new _StripeValidation();
                stripeV.setAddress_qid(add_qid);
                stripeV.init();
        }
    },

    /**
     * Initialize filepickerIO uploader
     * @param options - the filepickerIO options
     */
    setFilePickerIOUpload: function( options )
    {
        //check if filepickerIO script is available
        if (
            options && typeof filepicker === "object" &&
            typeof _JF_filepickerIO === "function"
        )
        {
            //start the filepickerIO Uploader
            var fp = new _JF_filepickerIO();
            fp.init(options);
        }
        else
        {
            console.error("filepicker OR _JF_filepickerIO object library are missing");
        }
    },

    /**
     * Initiates the capctha element
     * @param {Object} id
     */
    initCaptcha: function(id){
        /**
         * When captcha image requested on foreign pages
         * It gives error on initial load, probably because
         * SCRIPT embed. However when we delay the execution 
         * Image request this problems resolves.
         */
        setTimeout(function(){
            var a = new Ajax.Jsonp(JotForm.server, {
                parameters: {
                    action: 'getCaptchaId'
                },
                evalJSON: 'force',
                onComplete: function(t){
                    t = t.responseJSON || t;
                    if (t.success) {
                        $(id + '_captcha').src = 'https://www.jotform.com/server.php?action=getCaptchaImg&code=' + t.num;
                        $(id + '_captcha_id').value = t.num;
                    }
                }
            });
        }, 150);
    },
    /**
     * Relads a new image for captcha
     * @param {Object} id
     */
    reloadCaptcha: function(id){
        $(id + '_captcha').src = JotForm.url+'images/blank.gif';
        JotForm.initCaptcha(id);
    },
    /**
     * Zero padding for a given number
     * @param {Object} n
     * @param {Object} totalDigits
     */
    addZeros: function(n, totalDigits){
        n = n.toString();
        var pd = '';
        if (totalDigits > n.length) {
            for (i = 0; i < (totalDigits - n.length); i++) {
                pd += '0';
            }
        }
        return pd + n.toString();
    },
    /**
     * @param {Object} d
     */
    formatDate: function(d){
        var date = d.date;
        var month = JotForm.addZeros(date.getMonth() + 1, 2);
        var day = JotForm.addZeros(date.getDate(), 2);
        var year = date.getYear() < 1000 ? date.getYear() + 1900 : date.getYear();
        var id = d.dateField.id.replace(/\w+\_/gim, '');
        $('month_' + id).value = month;
        $('day_' + id).value = day;
        $('year_' + id).value = year;
        $('id_'+id).fire('date:changed');
    },
    /**
     * Highlights the lines when an input is focused
     */
    highLightLines: function(){
        
        // Highlight selected line
        $$('.form-line').each(function(l, i){
            l.select('input, select, textarea, div, table div, button').each(function(i){
                
                i.observe('focus', function(){
                    if (JotForm.isCollapsed(l)) {
                        JotForm.getCollapseBar(l).run('click');
                    }
                    if(!JotForm.highlightInputs){ return; }
                    l.addClassName('form-line-active');
                    // for descriptions
                    if(l.__classAdded){ l.__classAdded = false; }
                }).observe('blur', function(){
                    if(!JotForm.highlightInputs){ return; }
                    l.removeClassName('form-line-active');
                });
            });
        });
    },
    /**
     * Gets the container FORM of the element
     * @param {Object} element
     */
    getForm: function(element){
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return false;
        }
        if (element.tagName == "FORM") {
            return $(element);
        }
        return JotForm.getForm(element.parentNode);
    },
    /**
     * Gets the container of the input
     * @param {Object} element
     */
    getContainer: function(element){
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return false;
        }
        if (element.hasClassName("form-line")) {
            return $(element);
        }
        return JotForm.getContainer(element.parentNode);
    },
    
    /**
     * Get the containing section the element
     * @param {Object} element
     */
    getSection: function(element){
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return false;
        }
        if ((element.hasClassName("form-section-closed") || element.hasClassName("form-section")) && !element.id.match(/^section_/)) {
            return element;
        }
        return JotForm.getSection(element.parentNode);
    },
    /**
     * Get the fields collapse bar
     * @param {Object} element
     */
    getCollapseBar: function(element){
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return false;
        }
        if (element.hasClassName("form-section-closed") || element.hasClassName("form-section")) {
            return element.select('.form-collapse-table')[0];
        }
        return JotForm.getCollapseBar(element.parentNode);
    },
    /**
     * Check if the input is collapsed
     * @param {Object} element
     */
    isCollapsed: function(element){
        element = $(element);
        if (!element.parentNode) {
            return false;
        }
        if (element && element.tagName == "BODY") {
            return false;
        }
        if (element.className == "form-section-closed") {
            return true;
        }
        return JotForm.isCollapsed(element.parentNode);
    },
    /**
     * Check if the input is visible
     * @param {Object} element
     */
    isVisible: function(element){
        element = $(element);
        if (!element.parentNode) {
            return false;
        }

        if(element.hasClassName('always-hidden')) {
            return false;
        }
        
        if (element && element.tagName == "BODY") {
            return true;
        }
        
        //exception for rich text editor because element is never visible
        if(element.hasClassName("form-textarea") && element.up('div').down('.nicEdit-main') 
                && (element.up('.form-line') && JotForm.isVisible(element.up('.form-line')))) {
            
            return true;
        }

        if (element.style.display == "none" || element.style.visibility == "hidden") {
            return false;
        }

        return JotForm.isVisible(element.parentNode);
    },
    
    /**
     * Emre: to eneable/disable all submit buttons in multi-forms
     */
    enableDisableButtonsInMultiForms: function() {
        var allButtons = $$('.form-submit-button');
        allButtons.each(function(b) {
            if(b.up('ul.form-section')) {
                if(b.up('ul.form-section').style.display == "none") {
                    b.disable();
                } else {
                    if(b.className.indexOf("disabled") == -1){
                        b.enable();
                    }
                }
            }
        });
    },
    
    /**
     * Enables back the buttons
     */
    enableButtons: function(){
        setTimeout(function(){
            $$('.form-submit-button').each(function(b){
                b.enable();
                b.innerHTML = b.oldText;
            });
        }, 60);
    },
    
    /**
     * Sets the actions for buttons
     * - Disables the submit when clicked to prevent double submit.
     * - Adds confirmation for form reset
     * - Handles the print button
     */
    setButtonActions: function(){

        $$('.form-submit-button').each(function(b){
            b.oldText = b.innerHTML;
            b.enable(); // enable previously disabled button

            //Emre: to provide sending form with with clicking "enter" button in Multi-page forms
            //JotForm.enableDisableButtonsInMultiForms();
            if(getQuerystring('qp') === "") {
                b.observe('click', function(){
                    setTimeout(function(){
                        //Emre: to display all submit buttons
                        if(!$$('.form-error-message')[0] && !$$('.form-textarea-limit-indicator-error')[0]){ //Emre: when limit text are is used, submit button doesn't work (51335)
                           var allButtons  = $$('.form-submit-button');
                           allButtons.each(function(bu){
                               bu.innerHTML = JotForm.texts.pleaseWait;
                              //Emre: submit button problem (51335)
                               bu.addClassName('lastDisabled');
                               bu.disable();
                           });
                        }
                    }, 50);
                });
            }
        });

        $$('.form-submit-reset').each(function(b){
            b.onclick = function(){
                if (!confirm(JotForm.texts.confirmClearForm)) {
                    return false;
                }

                //clear all errors after clear form called start feature request 154829
                $$(".form-line-error").each(function(tmp){
                    tmp.removeClassName("form-line-error");

                });

                $$(".form-error-message",".form-button-error").each(function(tmp){
                    tmp.remove();
                });
                //clear all errors after form called end 
                //feature request 154940  must reset any form char limits for textareas start

                    $$(".form-textarea-limit-indicator > span").each(function(tmp){
                        var raw = tmp.innerHTML;
                        tmp.innerHTML = raw.replace(raw.substring(0,raw.indexOf("/")),"0" );

                    });

                //feature request implementation end
                
                //bugfix 187865  also reset grading tools total field
                $$("span[id^=grade_point_]").each(function(tmp){
                  tmp.innerHTML = 0;
                });
                $$(".form-grading-error").each(function(tmp){
                  tmp.innerHTML = ""; //also remove any previous grading errors
                });
                //bugfix end
                //note: TODO: instead of distinctively handling corner cases, it is best to fire a form change event that will trigger correct behaviour -kemal 

                setTimeout(function(){
                    $H(JotForm.fieldConditions).each(function(pair){
                        var field = pair.key;
                        var event = pair.value.event;
                        if(!$(field)){ return; }
                        $(field).run(event);
                    });
                }, 50);
            };
        });
        
        $$('.form-submit-print').each(function(print_button){
        
            print_button.observe("click", function(){
                $(print_button.parentNode).hide();
                //nicedit compatibility start: 
                var hidden_nicedits_arr = []; //nicedit.js rich text editors require special actions this will hold them to allow us to restore them to later stage
                var nicedit_textarea_to_hide = []; //after print completed textareas will be shown, we do not want nicedit textareas to be shown
                //nicedit compatibility end 

                $$('.form-textarea, .form-textbox').each(function(el){
                    
                    if(!el.type){ // type of slider is undefined
                       el.value = el.value || '0'; // to protect problem when slider has no value
                    }
                    //Emre: to prevent css problem on "Date Time" so <span> must be added(66610)
                    var dateSeparate;
                    if(dateSeparate = el.next('.date-separate')){
                        dateSeparate.hide();
                    }
                    //Emre: we must specify "width" and "height" to prevent getting new line
                    var elWidth = "";
                    if(el.value.length < el.size){
                        elWidth = "width:" + el.size*9 + "px;";
                    }

                    //kemal: 'display:inline-block' added to prevent bug:219794 phone field prints miss aligned. display:inline-block only added el is of Phone Field
                    if(el.id.indexOf("_area") != -1 || el.id.indexOf("_phone") != -1 || (el.id.indexOf("_country") != -1 && el.readAttribute('type') == 'tel')){
                        elWidth += " display:inline-block;"
                    }

                    //nicedit compatibility start: kemal: richtext editor compatibility: 1st check if el is form-textarea and also is a rich text editor
                    if(el.hasClassName("form-textarea") && "nicEditors" in window){ //"nicEditors" in window added for somehow if this check fails, do not give errors
                        $$("#cid_"+el.id.split("_")[1]+" > div:nth-child(1)").each(function(tmpel){
                            if(tmpel.readAttribute("unselectable") == "on"){
                                for(var i=0; i<nicEditors.editors.length;i++){
                                    nicEditors.editors[i].nicInstances[0].saveContent(); 
                                }
                                //update richtext value
                                $$("#cid_"+el.id.split("_")[1]+" > div").each(function(richtextdivs){
                                    richtextdivs.hide();
                                    hidden_nicedits_arr.push(richtextdivs); //push hidden divs to hidden_nicedits_arr to be later shown
                                });
                                nicedit_textarea_to_hide.push(el);// push textarea of nicedit, to be later hidden, because after print process completes we show all textareas by default
                            }
                        });
                    }
                    //nicedit compatibility end 
                   
                    el.insert({
                        before: new Element('div', {
                            className: 'print_fields'
                        }).update(el.value.replace(/\n/g, '<br>')).setStyle('border:1px solid #ccc; padding:1px 4px; min-height:18px;' + elWidth)
                    }).hide();
                });
                window.print();
                
                $$('.form-textarea, .form-textbox, .date-separate').invoke('show');

                //nicedit compatibility start: also show hidden richtextEditor divs and hide richtextEditor textareas start
                for(var i=0; i<hidden_nicedits_arr.length;i++){hidden_nicedits_arr[i].show();}
                for(var i=0; i<nicedit_textarea_to_hide.length;i++){nicedit_textarea_to_hide[i].hide();}
                //nicedit compatibility end

                $$('.print_fields').invoke('remove');
                $(print_button.parentNode).show();
            });
            
        });
    },

    /**
    * These will correct any errors in a tool with a validations
    * especially in hidden mode. Thus it will ignore the said validation
    */
    hasHiddenValidationConflicts: function( input )
    {
        var hiddenOBJ = input.up('li.form-line');
        return hiddenOBJ && (hiddenOBJ.hasClassName('form-field-hidden') || hiddenOBJ.up('ul.form-section').hasClassName('form-field-hidden'));
    },

    /**
     * Handles the functionality of control_grading tool
     */
    initGradingInputs: function(){
        
        var _this = this;//JotForm object

        $$('.form-grading-input').each(function(item){

          //register a blur event to validate the
          item.observe('blur', function(){
            item.validateGradingInputs();
          });
          item.observe('keyup', function(){
            item.validateGradingInputs();
          });

          //create a function that will check the validity of inputs
          //attach it to the items/grading inputs
          item.validateGradingInputs = function()
          {
            var item = this,
              id = item.id.replace(/input_(\d+)_\d+/, "$1"),
              total = 0,
              _parentNode = $(item.parentNode.parentNode),
              numeric = /^(\d+[\.]?)+$/,
              isNotNumeric = false;

            //correct any errors first that is attach in the item obj
            item.errored = false;

            _parentNode.select(".form-grading-input").each(function(sibling){
                if ( sibling.value && !numeric.test( sibling.value ) )
                {
                  isNotNumeric = true;
                  throw $break;
                }
                total += parseFloat(sibling.value) || 0;
            });

            //check if hidden, if so return its valid
            if( _this.hasHiddenValidationConflicts(item) ) return JotForm.corrected(item);

            //if not numeric then return an error
            if( isNotNumeric ) {
              return JotForm.errored( item, JotForm.texts.numeric );
            }

            if($("grade_total_" + id)) {
                //set the grade error notifier to empty
                $("grade_error_" + id).innerHTML = "";
                //set the allowed total to the grade_point notifier
                var allowed_total = parseFloat( $("grade_total_" + id).innerHTML );
                $("grade_point_" + id).innerHTML = total;

                if ( total > allowed_total) 
                {
                    //do the error display
                    $("grade_error_" + id ).innerHTML = ' ' + JotForm.texts.lessThan + ' <b>' + allowed_total + '</b>.';
                    return JotForm.errored(item, JotForm.texts.gradingScoreError + " " + allowed_total );
                }
                else
                {
                  //remove error display
                  return JotForm.corrected(item);
                }
            } else {
                return JotForm.corrected(item);
            }
          }
        });
    },
    /**
     * Handles the functionality of control_spinner tool
     */
    initSpinnerInputs: function()
    {
        var _this = this;//JotForm object

        $$('.form-spinner-input').each(function(item){

          //register a blur/change event to validate the data
          item.observe('blur', function(){
            item.validateSpinnerInputs();
          }).observe('change', function(){
            item.validateSpinnerInputs();
          });

          //register an event when the carret is clicked
          var c_parent = item.up('table.form-spinner'),
              c_up = c_parent.select('td.form-spinner-up')[0],
              c_down = c_parent.select('td.form-spinner-down')[0];

          c_up.observe('click', function(e){
              item.validateSpinnerInputs();
          });
          c_down.observe('click', function(e){
              item.validateSpinnerInputs();
          });

          //create a function that will check the validity of inputs
          //attach it to the items/spinner inputs
          item.validateSpinnerInputs = function()
          {
            var item = this,
            id = item.id.replace(/input_(\d+)_\d+/, "$1"),
            numeric = /^(-?\d+[\.]?)+$/,
            numericDotStart = /^([\.]\d+)+$/,  //accept numbers starting with dot
            userInput = item.value || 0;

            //correct any errors first that is attach in the item obj
            item.errored = false;

            //check if hidden, if so return its valid
            if( _this.hasHiddenValidationConflicts(item) ) return JotForm.corrected(item);

            if( userInput && !numeric.test( userInput ) &&  !numericDotStart.test( userInput ) )
            {
                return JotForm.errored( item, JotForm.texts.numeric );
            }

            //read the min and max val total, and check for inputs
            var min_val = parseInt( item.readAttribute('data-spinnermin') ) || false,
                max_val = parseInt( item.readAttribute('data-spinnermax') ) || false;

            if( min_val && userInput < min_val )
            {
              return JotForm.errored(item, JotForm.texts.inputCarretErrorA + " " + min_val );
            }
            else if ( max_val && userInput > max_val )
            {
              return JotForm.errored(item, JotForm.texts.inputCarretErrorB + " " + max_val );
            }
            else
            {
              //remove error display
              return JotForm.corrected(item);
            }
          }
        });
    },


    /**
     * Handles the functionality of control_number tool
     */
    initNumberInputs: function()
    {
        var _this = this;//JotForm object
      
        $$('.form-number-input').each(function(item){

          //register a blur/change event to validate the data
          item.observe('blur', function(){
            item.validateNumberInputs();
          }).observe('change', function(){
            item.validateNumberInputs();
          });

          //create a function that will check the validity of inputs
          //attach it to the items/number inputs
          item.validateNumberInputs = function()
          {
            var item = this,
            id = item.id.replace(/input_(\d+)_\d+/, "$1"),
            numeric = /^(-?\d+[\.]?)+$/,
            numericDotStart = /^([\.]\d+)+$/;  //accept numbers starting with dot

            //correct any errors first that is attach in the item obj
            item.errored = false;

            //check if hidden, if so return its valid
            if( _this.hasHiddenValidationConflicts(item) ) return JotForm.corrected(item);

            if( item.value && !numeric.test( item.value ) && !numericDotStart.test( item.value ) )
            {
                return JotForm.errored( item, JotForm.texts.numeric );
            }

            //read the min and max val total, and check for inputs
            var min_val = parseInt( item.readAttribute('data-numbermin') ),
                max_val = parseInt( item.readAttribute('data-numbermax') ),
                max_len = parseInt( item.readAttribute('maxlength') );

            if( max_len && item.value && item.value.length > max_len )
            {
              return JotForm.errored(item,  JotForm.texts.maxDigitsError + " " + max_len );
            }
            else if( ( min_val || min_val == 0 ) && parseInt( item.value ) < min_val )
            {
              // item.value = min_val;
              return JotForm.errored(item, JotForm.texts.inputCarretErrorA + " " + min_val );
            }
            else if ( max_val && parseInt( item.value ) > max_val )
            {
              // item.value = max_val;
              return JotForm.errored(item, JotForm.texts.inputCarretErrorB + " " + max_val );
            }
            else
            {
              //remove error display
              return JotForm.corrected(item);
            }
          }
        });
    },
    /**
     * Handles the pages of the form
     */
    backStack: [],
    currentSection: false,

    handlePages: function(){
        var $this = this;
        var pages = [];
        var last;
        
        // 345261: by default, back button containers gets its width from the label to maintain alignment
        // if they are wider than half the form, resize them
        if($$('.form-label-left').length > 0 ){
            var labelWidth = parseInt($$('.form-label-left')[0].getStyle('width')),
                formWidth = parseInt($$('.form-all')[0].getStyle('width')),
                backButtonWidth = labelWidth > formWidth/2 ? formWidth/2 : labelWidth;
            $$('.form-pagebreak-back-container').each(function(back){
                // resize only if no custom css has been used
                if(back.style.width === ''){
                    back.style.width = (backButtonWidth - 14) + 'px';
                }
            });
        }
        
        $$('.form-pagebreak').each(function(page, i){
            var section = $(page.parentNode.parentNode);
            if (i >= 1) {
                // Hide other pages
                section.hide();
            }else{
                JotForm.currentSection = section;
            }
            pages.push(section); // Collect pages
            
            section.pagesIndex = i+1;

            function stopEnterKey(evt) {
                var evt = (evt) ? evt : ((event) ? event : null);
                var node = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
                if ((evt.keyCode == 13) && (node.type == "text")) { return false; }
            }
            document.onkeypress = stopEnterKey;
            
            section.select('.form-pagebreak-next').invoke('observe', 'click', function(){ // When next button is clicked
                if(JotForm.saving){return;}
                if (JotForm.validateAll(JotForm.getForm(section)) || getQuerystring('qp') !== "") {

                	if (window.parent && window.parent != window) {
                		window.parent.postMessage('scrollIntoView', '*');
                	}

                    if(JotForm.nextPage){
                        JotForm.backStack.push(section.hide()); // Hide current
                        JotForm.currentSection = JotForm.nextPage.show();

                        //Emre: to prevent page to jump to the top (55389)
                        if(!$this.noJump){
                            JotForm.currentSection.scrollIntoView(true);
                        }

                        JotForm.enableDisableButtonsInMultiForms();
                    }else if (section.next()) { // If there is a next page
                        JotForm.backStack.push(section.hide()); // Hide current
                        // This code will be replaced with condition selector
                        JotForm.currentSection = section.next().show();

                        //Emre
                        if(!$this.noJump){
                            JotForm.currentSection.scrollIntoView(true);
                        }

                        JotForm.enableDisableButtonsInMultiForms();
                    }

                    JotForm.nextPage = false;
                    if(JotForm.saveForm){
                        JotForm.hiddenSubmit(JotForm.getForm(section));
                    }
                } else {
                    try {
                        $$('.form-button-error').invoke('remove');
                        $$('.form-pagebreak-next').each(function(nextButton){
                            var errorBox = new Element('div', {className:'form-button-error'});
                            errorBox.insert(JotForm.texts.generalPageError);
                            $(nextButton.parentNode.parentNode).insert(errorBox);
                        });
                    } catch(e) {
                        // couldnt find 'next button'
                    }
                }
            });
            
            section.select('.form-pagebreak-back').invoke('observe', 'click', function(){ // When back button is clicked
            	if (window.parent && window.parent != window) {
            		window.parent.postMessage('scrollIntoView', '*');
            	}
            	
                if(JotForm.saving){return;}
                section.hide();
                JotForm.currentSection = JotForm.backStack.pop().show();
                //Emre
                if(!$this.noJump){
                    JotForm.currentSection.scrollIntoView(true);
                }

                JotForm.nextPage = false;

                JotForm.enableDisableButtonsInMultiForms();

                if(JotForm.saveForm){
                    JotForm.hiddenSubmit(JotForm.getForm(section));
                }
                //clear if there is an error bar near back-next buttons
                $$('.form-button-error').invoke('remove');
            });
            
        });
        
        // Handle trailing page
        if (pages.length > 0) {
            var allSections = $$('.form-section');
            if (allSections.length > 0) {
                last = allSections[allSections.length - 1];
            }
            
            // if there is a last page
            if (last) {
                last.pagesIndex = allSections.length;
                pages.push(last); // add it with the other pages
                last.hide(); // hide it until we open it
                var li = new Element('li', {
                    className: 'form-input-wide'
                });
                var cont = new Element('div', {
                    className: 'form-pagebreak'
                });
                var backCont = new Element('div', {
                    className: 'form-pagebreak-back-container'
                });
                var back = $$('.form-pagebreak-back-container')[0].select('button')[0];
                
                back.observe('click', function(){
                    if(JotForm.saving){return;}
                    last.hide();
                    JotForm.nextPage = false;
                });
                
                backCont.insert(back);
                cont.insert(backCont);
                li.insert(cont);
                last.insert(li);
            }
        }
        
    },
    /**
     * Handles the functionality of Form Collapse tool
     */
    handleFormCollapse: function(){
        var $this = this;
        var openBar = false;
        var openCount = 0;
        $$('.form-collapse-table').each(function(bar){
            var section = $(bar.parentNode.parentNode);
            //section.setUnselectable();  //ntw - bug#209358  - If anyone knows why this line exists please tell me - prevents selection in firefox under collapses and I cannot see that it performs any other function
            if (section.className == "form-section-closed") {
                section.closed = true;
            } else {
                if (section.select('.form-collapse-hidden').length < 0) {
                    openBar = section;
                    openCount++;
                }
            }
            bar.observe('click', function(){
            
                if (section.closed) {
                
                    section.setStyle('overflow:visible; height:auto');
                    var h = section.getHeight();
                    
                    if (openBar && openBar != section && openCount <= 1) {
                        openBar.className = "form-section-closed";
                        openBar.shift({
                            height: 60,
                            duration: 0.5
                        });
                        openBar.select('.form-collapse-right-show').each(function(e){
                            e.addClassName('form-collapse-right-hide').removeClassName('form-collapse-right-show');
                        });
                        openBar.closed = true;
                    }
                    openBar = section;
                    section.setStyle('overflow:hidden; height:60px');
                    // Wait for focus
                    setTimeout(function(){
                        section.scrollTop = 0;
                        section.className = "form-section";
                    }, 1);
                    
                    section.shift({
                        height: h,
                        duration: 0.5,
                        onEnd: function(e){
                            e.scrollTop = 0;
                            e.setStyle("height:auto;");
                            if(!$this.noJump){
                                e.scrollIntoView();
                            }
                        }
                    });
                    section.select('.form-collapse-right-hide').each(function(e){
                        e.addClassName('form-collapse-right-show').removeClassName('form-collapse-right-hide');
                    });
                    section.closed = false;
                } else {
                
                    section.scrollTop = 0;
                    section.shift({
                        height: 60,
                        duration: 0.5,
                        onEnd: function(e){
                            e.className = "form-section-closed";
                        }
                    });
                    
                    //Emre: Added if because of preventing collapse open/close bug
                    if(openBar){
                        openBar.select('.form-collapse-right-show').each(function(e){
                            e.addClassName('form-collapse-right-hide').removeClassName('form-collapse-right-show');
                        });
                    }

                    section.closed = true;
                }
            });
        });
    },
    /**
     * Shows or Hides the credit card form according to payment method selected
     * for PayPalPro
     */
    handlePayPalProMethods: function(){
        if ($('creditCardTable')) {
            $$('.paymentTypeRadios').each(function(radio){
                radio.observe('click', function(){
                    if (radio.checked && radio.value === "express") {
                        $('creditCardTable').hide();
                    }
                    // If credit is selected and payment total is greater than zero or if there is no discount coupon
                    if (radio.checked && radio.value === "credit" && ( JotForm.paymentTotal > 0 || Object.keys(JotForm.discounts).length === 0 ) ) {
                        $('creditCardTable').show();
                    }
                });
            });
        }
    },
    
    /**
     * Creates description boxes next to input boxes
     * @param {Object} input
     * @param {Object} message
     */
    description: function(input, message){
        // v2 has bugs, v3 has stupid solutions
        if(message == "20"){ return; } // Don't remove this or some birthday pickers will start to show 20 as description
        
        var lineDescription = false;
        if(!$(input)){
            var id = input.replace(/[^\d]/gim, '');
            if($("id_"+id)){
                input = $("id_"+id);
                lineDescription = true;
            }else if($('section_'+id)){
                input = $('section_'+id);
                lineDescription = true;
            }else{
                return; /* no element found to display a description */             
            }
        }
        
        if($(input).setSliderValue){
            input = $($(input).parentNode);            
        }
        
        var cont = JotForm.getContainer(input);
        if(!cont){
            return;
        }
        var right = false;
        
        var bubble = new Element('div', { className: 'form-description'});
        var arrow = new Element('div', { className: 'form-description-arrow' });
        var arrowsmall = new Element('div', { className: 'form-description-arrow-small' });
        var content = new Element('div', { className: 'form-description-content' });
        var indicator;
        
        if("desc" in document.get && document.get.desc == 'v2'){
            right = true;
            cont.insert(indicator = new Element('div', {className:'form-description-indicator'}));
            bubble.addClassName('right');
        }
        
        content.insert(message);
        bubble.insert(arrow).insert(arrowsmall).insert(content).hide();
        
        cont.insert(bubble);
        
        if((cont.getWidth()/2) < bubble.getWidth()){
            bubble.setStyle('right: -' + ( cont.getWidth() - ( right ? 100 : 20 ) ) + 'px');
        }
        
        if(right){
            var h = indicator.measure('height');
            arrow.setStyle('top:'+((h /2) - 20)+'px');
            arrowsmall.setStyle('top:'+((h /2) - 17)+'px');
            
            $(cont).mouseEnter(function(){
                cont.setStyle('z-index:10000');
                if(!cont.hasClassName('form-line-active')){
                    cont.addClassName('form-line-active');
                    cont.__classAdded = true;
                }
                bubble.show();
            }, function(){
                if(cont.__classAdded){
                    cont.removeClassName('form-line-active');
                    cont.__classAdded = false;
                }
                cont.setStyle('z-index:0');
                bubble.hide();
            });
            $(input).observe('keydown', function(){
                cont.setStyle('z-index:0');
                bubble.hide();
            });
        }else{
            if(lineDescription){
                $(input).mouseEnter(function(){
                    cont.setStyle('z-index:10000');
                    bubble.show();
                }, function(){
                    cont.setStyle('z-index:0');
                    bubble.hide();
                });
            }else{
                $(cont).mouseEnter(function(){
                    cont.setStyle('z-index:10000');
                    bubble.show();
                }, function(){
                    cont.setStyle('z-index:0');
                    bubble.hide();
                });
                $(input).observe('keyup', function(){
                    cont.setStyle('z-index:0');
                    bubble.hide();
                });
                $(input).observe('focus', function(){
                    cont.setStyle('z-index:10000');
                    bubble.show();
                });
                $(input).observe('blur', function(){
                    cont.setStyle('z-index:0');
                    bubble.hide();
                });
            }
        }
    },
    
    /**
     * do all validations at once and stop on the first error
     * @param {Object} form
     */
    validateAll: function(form){

        if(getQuerystring('qp') !== "") {return true;}
        var ret = true;
        
        if($$('.form-textarea-limit-indicator-error')[0]){
            ret = false;
        }

        if ($$('.form-datetime-validation-error').first()) {
            ret = false;
        }
        
        if(window.signatureForm){
            var pads = jQuery(".pad");

            for(var i=0; i<pads.length; i++){
                var pad = pads[i];
                if(jQuery(pad).attr("data-required")==="true"){
                    if(jQuery(pad).parent().parent().parent().is(":visible")){
                        var w = jQuery(pad).parent().parent()
                        if(jQuery(pad).jSignature('getData','base30')[1].length == 0){
                            ret = false;
                            if(w.find(".form-line-error").length==0){
                                w.append('<div class="form-line-error" style="float:left;">'+
                                    '<div class="form-error-message">'+
                                    '<img src="http://mustafa.jotform.pro/images/exclamation-octagon.png" align="left" style="margin-right:5px;">'+
                                    '<div class="form-error-arrow">'+
                                    '<div class="form-error-arrow-inner"></div>'+
                                    '</div>'+
                                    'This field is required</div></div>');
                            }
                        } else {
                          w.find(".form-line-error").remove();
                        }   
                    }             
                }
            }
        }

        if(window.JCFServerCommon !== undefined) {
            var widgetInputs = $$('.widget-required');
            widgetInputs.each(function(el) {
                if(JotForm.isVisible(el)) {
                    if($(JotForm.currentSection) && $(JotForm.currentSection).select('.form-section').length > 0) {
                        if(el.up('.form-section').id === $(JotForm.currentSection).select('.form-section')[0].id){
                            if(el.value.length === 0) {
                                ret = false;
                            }
                        }
                    } else {
                        if(el.up('.form-section').visible()){
                            if(el.value.length === 0) {
                                ret = false;
                            }
                        }                    
                    }
                }
            });
        }

        var c = "";
        if(form && form.id){
            c = "#"+form.id+" ";
        }
        
        $$(c + '*[class*="validate"]').each(function(input){
            if(input.validateInput === undefined){ return; /* continue; */ }
            if (!(!!input.validateInput && input.validateInput()) ) {
                ret = JotForm.hasHiddenValidationConflicts(input);
            }
        });
        
        return ret;
    },
    
    /**
     * When an input is errored
     * @param {Object} input
     * @param {Object} message
     */
    errored: function(input, message){
        
        input = $(input);
        
        if (input.errored) {
            return false;
        }
        
        if(input.runHint){
            input.runHint();
        }/*else{
            //input.select();
        }*/

        if(this.url.search("https") == -1){
          var preLink = "http://cdn.jotfor.ms/";
        }else{
          var preLink = "https://static-interlogyllc.netdna-ssl.com/";
          // var preLink = "https://www.jotform.com/";
        }
        
        if (JotForm.isCollapsed(input)) {

            var collapse = JotForm.getCollapseBar(input);
            if (!collapse.errored) {
                collapse.select(".form-collapse-mid")[0].insert({
                    top: '<img src="'+preLink+'images/exclamation-octagon.png" align="bottom" style="margin-right:5px;"> '
                }).setStyle({ color: 'red' });
                collapse.errored = true;
            }
        }
        var container = JotForm.getContainer(input);

        input.errored = true;
        input.addClassName('form-validation-error');
        container.addClassName('form-line-error');
        var insertEl = container;
        
        //if(JotForm.debug){
            insertEl = container.select('.form-input')[0];
            if (!insertEl) {
                insertEl = container.select('.form-input-wide')[0];
            }
            if(!insertEl){
                insertEl = container;
            }
        //}
        insertEl.select('.form-error-message').invoke('remove');

        insertEl.insert(new Element('div', {
            className: 'form-error-message'
        }).insert('<img src="'+preLink+'images/exclamation-octagon.png" align="left" style="margin-right:5px;"> ' + message).insert(
        new Element('div', {className:'form-error-arrow'}).insert(new Element('div', {className:'form-error-arrow-inner'}))));
        
        return false;
    },
    
    /**
     * When an input is corrected
     * @param {Object} input
     */
    corrected: function(input){
        JotForm.hideButtonMessage();
        input = $(input);
        input.errored = false;
        if (JotForm.isCollapsed(input)) {
            var collapse = JotForm.getCollapseBar(input);
            if (collapse.errored) {
                collapse.select(".form-collapse-mid")[0].setStyle({
                    color: ''
                }).select('img')[0].remove();
                collapse.errored = false;
            }
        }
        var container = JotForm.getContainer(input);
        if(!container){ return true; }
        container.select(".form-validation-error").invoke('removeClassName', 'form-validation-error');
        container.removeClassName('form-line-error');
        container.select('.form-error-message').invoke('remove');
        return true;
    },
    
    hideButtonMessage: function(){
        $$('.form-button-error').invoke('remove');
    },
    
    showButtonMessage: function(){
        this.hideButtonMessage();
        
        $$('.form-submit-button').each(function(button){
            var errorBox = new Element('div', {className:'form-button-error'});
            errorBox.insert('<p>' + JotForm.texts.generalError + '</p>');
            $(button.parentNode.parentNode).insert(errorBox);
        });
    },
    
    /**
     * Sets all validations to forms
     */
    validator: function(){
        
        if(this.debugOptions && this.debugOptions.stopValidations){
            this.info('Validations stopped by debug parameter');
            return true;
        }
        var $this = this;
        
        $A(JotForm.forms).each(function(form){ // for each JotForm form on the page 
            if (form.validationSet) {
                return; /* continue; */
            }
            
            form.validationSet = true;
            form.observe('submit', function(e){ // Set on submit validation
                try {
                    if (!JotForm.validateAll(form)) {
                        JotForm.enableButtons();
                        JotForm.showButtonMessage();
                        e.stop();
                        return;
                    }
                } catch (err) {
                    JotForm.error(err);
                    e.stop();
                    return;
                }

                //enable any disabled(readonly) time dropdowns so they are submitted with the form
                $$('.time-dropdown').each(function(el) { el.enable();});

                // We will clear the contents of hidden fields, users don't want see the hidden fields on subscriptions
                $$('.form-field-hidden input', '.form-field-hidden select', '.form-field-hidden textarea').each(function(input) {
                    if(input.name == "simple_fpc") { // do not clear this field's value
                        return;
                    }
                    if (input.tagName == 'INPUT' && ['checkbox', 'radio'].include(input.type)) {
                        input.checked = false;
                    } else {
                        input.clear();
                    }
                });

                if(JotForm.compact && JotForm.imageSaved == false){
                    e.stop();
                    window.parent.saveAsImage();
                    // JotForm.enableButtons();
                    $(document).observe('image:loaded', function(){
                        var block;
                        $(document.body).insert(block = new Element('div').setStyle('position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);'));
                        block.insert('<table height="100%" width="100%"><tr><td align="center" valign="middle" style="font-family:Verdana;color:#fff;font-size:16px;">Please Wait...</td></tr></table>');
                        setTimeout(function(){
                            form.submit();
                        }, 1000);
                    });
                    return;
                }

                //validation for grading when the form is submitted
                var grading_inputs = form.select('.form-grading-input');
                if( grading_inputs )
                {
                  grading_inputs.each(function(item){
                    //call the validator function to validate the data
                    var validate = item.validateGradingInputs();
                    if( !validate )
                    {
                      e.stop();//stop submitting the form
                    }
                  });
                }

                //validation fo spinners when the form is submitted
                var spinner_inputs = form.select('.form-spinner-input');
                if( spinner_inputs )
                {
                  spinner_inputs.each(function(item){
                    //call the validator function to validate the data
                    var validate = item.validateSpinnerInputs();
                    if( !validate )
                    {
                      e.stop();//stop submitting the form
                    }
                  });
                }

                //validation fo numbers when the form is submitted
                var number_inputs = form.select('.form-number-input');
                if( number_inputs )
                {
                  number_inputs.each(function(item){
                    //call the validator function to validate the data
                    var validate = item.validateNumberInputs();
                    if( !validate )
                    {
                      e.stop();//stop submitting the form
                    }
                  });
                }
            });
            
            // for each validation element
            $$('#'+form.id+' *[class*="validate"]').each(function(input){
                JotForm.setFieldValidation(input);
            });
            
            $$('.form-upload').each(function(upload){
               
                try {

                    var required = !!upload.validateInput;
                    var exVal = upload.validateInput || Prototype.K;
                    
                    upload.validateInput = function(){

                        //clean any errors first if any
                        upload.errored = false;

                        if (exVal() !== false) { // Make sure other validation completed
                            
                            if(!upload.files){ return true; } // If files are not provied then don't do checks
                            
                            var acceptString = upload.readAttribute('accept') || upload.readAttribute('file-accept') || "";
                            var maxsizeString = upload.readAttribute('maxsize') || upload.readAttribute('file-maxsize') || "";
                            
                            var accept = acceptString.strip().split(/\s*\,\s*/gim);
                            var maxsize = parseInt(maxsizeString, 10) * 1024;
                            
                            var file = upload.files[0];
                            if (!file) {
                                return true;
                            } // No file was selected
                            
                            //Emre: to prevent extension of file problem in firefox7 (47183)
                            if(!file.fileName){ file.fileName = file.name; }
                
                            var ext = "";
                            if( JotForm.getFileExtension(file.fileName) ){
                                ext = JotForm.getFileExtension(file.fileName);
                            }
                            
                            if ( acceptString != "*" && !accept.include(ext) && !accept.include(ext.toLowerCase())) {
                                return JotForm.errored(upload, JotForm.texts.uploadExtensions + '<br/>' + acceptString);
                            }

                            //check if validation if real image is set to yes
                            //if so check again if the meta data is correct and only if the extension is correct
                            var validateImage = upload.readAttribute('data-imagevalidate') || false;
                            var validatedImageExt = "jpeg, jpg, png, gif, bmp";
                            if(
                              ( accept.include(ext) || accept.include(ext.toLowerCase()) ) && //for the accepted eextensions
                              validateImage && ( validateImage === 'yes' || validateImage === 'true' ) &&
                              ( validatedImageExt.include(ext) || validatedImageExt.include(ext.toLowerCase()) ) && //for the accepted valid images
                              typeof window.FileReader != undefined //only for modern browsers that supports it
                            )
                            {
                              //initiate the FileReader
                              var binary_reader = new FileReader();
                              binary_reader.onloadend = function(e) {
                                function ab2str(buf) {
                                  var
                                      binaryString = '',
                                      bytes = new Uint8Array(buf),
                                      length = bytes.length;
                                    for (var i = 0; i < length; i++) {
                                      binaryString += String.fromCharCode(bytes[i]);
                                    }
                                    return binaryString;
                                }
                                  var args = {
                                    filename: file.name,
                                    size: file.size,
                                    //convert string to binary
                                    binary: ab2str(e.target.result)
                                  };
                                  ImageInfo.loadInfo(args, function(){
                                    var info = ImageInfo.getAllFields(file.name);
                                    if( info.format === 'UNKNOWN' )
                                    {
                                      return JotForm.errored(upload, "You have uploaded an invalid image file type.");
                                    }
                                  });
                              }
                              //read file as buffer array (binaryString is deprecated)
                              binary_reader.readAsArrayBuffer(file);
                            }

                            //Emre: to prevent file.fileSize being undefined in Firefox 7 (48526)
                            //Emre: to prevent file upload not to work in Firefox 3.
                            if(!file.fileSize){ file.fileSize = file.size; }

                            if (file.fileSize > maxsize) {
                                return JotForm.errored(upload, JotForm.texts.uploadFilesize + ' ' + maxsizeString + 'Kb');
                            }
                            
                            return JotForm.corrected(upload);
                        }
                    };
                    
                    if (!required) {
                        upload.addClassName('validate[upload]');
                        upload.observe('blur', upload.validateInput);
                        }
                } catch (e) {

                    JotForm.error(e);

                }

            }); 
        });
    },


    /*
    * set validation function on field
    */
    setFieldValidation: function(input) {
        var $this = this;
        var reg = {
            email: /[a-z0-9!#$%&'*+\/=?\^_`{|}~\-]+(?:\.[a-z0-9!#$%&'*+\/=?\^_`{|}~\-]+)*@(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\-]*[a-z0-9])/i,
            alphanumeric: /^[a-zA-ZæøåäöÆØÅÄÖ0-9\s]+$/,
            numeric: /^(-?\d+[\.]?)+$/,
            numericDotStart: /^([\.]\d+)+$/,  //accept numbers starting with dot
            alphabetic: /^[a-zA-ZæøåäöÆØÅÄÖ\s]+$/,
            url: /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/
        };
        var validations = input.className.replace(/.*validate\[(.*)\].*/, '$1').split(/\s*,\s*/);
        
        input.validateInput = function(deep)
        {
            if (!JotForm.isVisible(input)) {
                return true; // if it's hidden then user cannot fill this field then don't validate
            }
            
            if(!$(input.parentNode).hasClassName('form-matrix-values')) //ntw
                JotForm.corrected(input); // First clean the element
            
            var vals = validations;
            
            if(input.hinted === true){
                input.clearHint();
                setTimeout(function(){
                    input.hintClear();
                }, 150);
            } // Clear hint value if exists

            //change where it deploys
            //to first check the data  of this inputs before going to the next with a validate[*] class
            if( input.readAttribute('data-type') === 'input-spinner' && input.value )
            {
                return input.validateSpinnerInputs();
            }
            else if( input.readAttribute('data-type') === 'input-grading' && input.value )
            {
                return input.validateGradingInputs();
            }
            else if( input.readAttribute('data-type') === 'input-number' && input.value )
            {
                return input.validateNumberInputs();
            }

            if(vals.include('disallowFree')) {
                var freeEmails = ['gmail','aim','outlook','hotmail', 'yahoo','mail','inbox'];
                for(var i=0; i<freeEmails.length; i++) {
                    if(input.value.indexOf("@" + freeEmails[i] + ".") > -1) {
                        return JotForm.errored(input, JotForm.texts.freeEmailError);
                    }
                }
            }

            if(vals.include('minSelection')) {
                var minSelection = parseInt(input.readAttribute('data-minSelection'));
                var numberChecked = 0;
                input.up('.form-line').select('input[type=checkbox]').each(function(check) {
                     if(check.checked) numberChecked++;
                });
                if(numberChecked > 0 && numberChecked < minSelection) {
                    return JotForm.errored(input, JotForm.texts.minSelectionsError + minSelection + '.');
                }
            }

            if(vals.include('maxSelection')) {
                var maxSelection = parseInt(input.readAttribute('data-maxSelection'));
                var numberChecked = 0;
                input.up('.form-line').select('input[type=checkbox]').each(function(check) {
                     if(check.checked) numberChecked++;
                });
                if(numberChecked > maxSelection) {
                    return JotForm.errored(input, JotForm.texts.maxSelectionsError + maxSelection + '.');
                }
            }

            if(vals.include('disallowPast')) {
                var id = input.id.split('year_').last();
                var inputtedDate = JotForm.getDateValue(id).split('T')[0];
                var dat =  new Date();
                var month = (dat.getMonth()+1 < 10)? '0'+(dat.getMonth()+1):dat.getMonth()+1;
                var day = (dat.getDate() < 10) ? '0' + dat.getDate() : dat.getDate();
                var currentDate = dat.getFullYear() + "-" + month + "-" + day;

                if(JotForm.checkValueByOperator('before', JotForm.strToDate(currentDate), JotForm.strToDate(inputtedDate))) {
                    return JotForm.errored(input, JotForm.texts.pastDatesDisallowed);
                }
            }

            //Emre confirmation email (36639)
            if (vals.include("Email_Confirm")) {
                //console.log("if (vals.include(\"Email_Confirm\")) {");
                var idEmail = input.id.replace(/.*_(\d+)(?:_confirm)?/gim, '$1'); //confirm email id is like "input_4_confirm"
                if(($('input_' + idEmail).value != $('input_' + idEmail + '_confirm').value)){
                    return JotForm.errored(input, JotForm.texts.confirmEmail);
                } else if (($('input_' + idEmail + '_confirm').value) && (!reg.email.test($('input_' + idEmail + '_confirm').value))) {
                    return JotForm.errored(input, JotForm.texts.email);
                }
            }
            if (vals.include("required")) {
                if (input.tagName == 'INPUT' && input.readAttribute('type') == "file") { // Upload
                    if(input.value.empty() && !input.uploadMarked){
                        return JotForm.errored(input, JotForm.texts.required);
                    }else{
                        return JotForm.corrected(input);
                    }
                } else if (input.tagName == "INPUT" && (input.readAttribute('type') == "radio" || input.readAttribute('type') == "checkbox")) {

                    if($(input.parentNode).hasClassName('form-matrix-values')){ // This is in a matrix
                        
                        var ty = input.readAttribute('type');
                        var matrixRows = {};
                        var oneChecked = false;
                        input.up('table').select('input').each(function(e){
                            if(!(e.name in matrixRows)){matrixRows[e.name] = false;}
                            if(matrixRows[e.name] !== true){matrixRows[e.name] = e.checked;}
                            if(matrixRows[e.name] === true){oneChecked = true;}
                        });
                        if(vals.include("requireOneAnswer")) {
                          if(!oneChecked) 
                            return JotForm.errored(input, JotForm.texts.requireOne);
                        } else if( ! $H(matrixRows).values().all()){
                            return JotForm.errored(input, JotForm.texts.requireEveryRow);
                        } else {
                            return JotForm.corrected(input);
                        }
                    
                    }else {
                        var baseInputName = input.name.substr(0,input.name.indexOf('['));
                        var otherInputName = baseInputName + '[other]';
                        var checkboxArray = [];
                            // If 'Other' input exists;
                            if (document.getElementsByName(otherInputName)[0]) {
                                // Assign all checkboxes including 'Other' to array
                                checkboxArray = $A(document.getElementsByName(baseInputName + '[]')); 
                                checkboxArray[checkboxArray.length] = document.getElementsByName(otherInputName)[0];
                                    // Validate each checkbox
                                if ( ! checkboxArray.map(function(e){ return e.checked; }).any()) {
                                        return JotForm.errored(input, JotForm.texts.required);
                                }
                            } else {
                                if ( ! $A(document.getElementsByName(input.name)).map(function(e){ return e.checked; }).any()) {
                                    return JotForm.errored(input, JotForm.texts.required);
                                }
                            }
                        
                    }
                } else if((input.tagName == "INPUT" || input.tagName == "SELECT") && $(input.parentNode).hasClassName('form-matrix-values')) {
                        var matrixRows = {};
                        var oneEntry = false;

                        input.up('table').select(input.tagName).each(function(e){
                            if(!(e.name in matrixRows)){matrixRows[e.name] = false;}
                            if(matrixRows[e.name] !== true){matrixRows[e.name] = (e.value && !e.value.strip(" ").empty());}
                            if(matrixRows[e.name] === true){oneEntry = true;}
                        });
                        if(vals.include("requireEveryRow") && ! $H(matrixRows).values().all()) {
                            return JotForm.errored(input, JotForm.texts.requireEveryRow);
                        } else if(vals.include("requireOneAnswer") && !oneEntry) {
                            return JotForm.errored(input, JotForm.texts.requireOne);
                        } else {
                            return JotForm.corrected(input);
                        }
                } else if (input.name && input.name.include("[")) {
                    try{
                        var cont = $this.getContainer(input);
                        // Ozan, bugfix: 133419, both input and select fields should be selected
                        var checkValues = cont.select('input,select[name*=' + input.name.replace(/\[.*$/, '') + ']').map(function(e){
                            // If this is an address field and country is not United States or Canada 
                            // then don't require state name
                            if(e.hasClassName('form-address-state')){
                                var country = cont.select('.form-address-country')[0].value;
                                if(country != 'United States' && country != 'Canada' && country != 'Please Select'){
                                    e.removeClassName('form-validation-error');
                                    e.__skipField = true;
                                    return false;
                                }
                            }else{
                                if(e.__skipField){
                                    e.__skipField = false;
                                }
                            }
                            
                            // If this is a custom quantity textbox
                            if(e.id.match(/input_[0-9]_quantity_[0-9]+_[0-9]+/) && e.type == 'text') {
                                var cb = $(((e.id.replace('_quantity', '')).match(/input_[0-9]_[0-9]+/))[0]);
                                // If product selected and quantity is not valid
                                if(cb.checked && (isNaN(e.value) || e.value == 0 || e.value.empty()) ) {
                                    e.addClassName('form-validation-error');
                                    return true;
                                }
                            }
                            
                            if(e.className.include('validate[required]') && JotForm.isVisible(e)){
                                if(e.value.empty() || e.value.strip() == 'Please Select'){
                                    e.addClassName('form-validation-error');
                                    return true;
                                }
                            }
                            e.removeClassName('form-validation-error');
                            return false;
                        });
                        
                        if (checkValues.any()) {
                            return JotForm.errored(input, JotForm.texts.required);
                        }
                    }catch(e){
                        // This can throw errors on internet explorer
                        JotForm.error(e);
                        return JotForm.corrected(input);
                    }
                }
                if(input.__skipField){
                    return JotForm.corrected(input);
                }
                if ( (!input.value || input.value.strip(" ").empty() || input.value.replace('<br>', '').empty() || input.value == 'Please Select') && !(input.readAttribute('type') == "radio" || input.readAttribute('type') == "checkbox") && !$(input.parentNode).hasClassName('form-matrix-values')) {
                    return JotForm.errored(input, JotForm.texts.required);
                }

                vals = vals.without("required");
                
            } else if (input.value.empty()) {
                // if field is not required and there is no value 
                // then skip other validations
                return true;
            }
            
            if (!vals[0]) {
                return true;
            }
            
            switch (vals[0]) {
                case "Email":
                    if (!reg.email.test(input.value)) {
                        return JotForm.errored(input, JotForm.texts.email);
                    }
                    break;
                case "Alphabetic":
                    if (!reg.alphabetic.test(input.value)) {
                        return JotForm.errored(input, JotForm.texts.alphabetic);
                    }
                    break;
                case "Numeric":
                    if (!reg.numeric.test(input.value) && !reg.numericDotStart.test(input.value)) {
                        return JotForm.errored(input, JotForm.texts.numeric);
                    }
                    break;
                case "AlphaNumeric":
                    if (!reg.alphanumeric.test(input.value)) {
                        return JotForm.errored(input, JotForm.texts.alphanumeric);
                    }
                    break;
                case "Url":
                    if (!reg.url.test(input.value)) {
                        return JotForm.errored(input, JotForm.texts.url);
                    }
                    break;
                default:
                    // throw ("This validation is not valid (" + vals[0] + ")");
            }
            return JotForm.corrected(input);
        };
        var validatorEvent = function(e){
            setTimeout(function(){ // to let focus event to work
                if($this.lastFocus && ($this.lastFocus == input || $this.getContainer($this.lastFocus) != $this.getContainer(input))){
                    input.validateInput();
                }else if(input.type == "hidden"){
                    input.validateInput(); // always run on hidden elements
                }
            }, 10);
        };
        
        if(input.type == 'hidden'){
            input.observe('change', validatorEvent);
        }else{
            input.observe('blur', validatorEvent);
        }

        if(input.up('.form-spinner')) {
            var spinnerEvent = function() {input.validateInput();};
            input.up('.form-spinner').down('.form-spinner-up').observe('click', spinnerEvent);
            input.up('.form-spinner').down('.form-spinner-down').observe('click', spinnerEvent);                  
        }

    },


    /**
     * Initiate facebook login operations
     * Check if user is already loggedin
     * watch login events to automatically populate fields
     * disable submits until login is completed
     */
    FBInit: function(){
        // Disable the Submit's here, form will not submit until integration is completed
        JotForm.FBNoSubmit = true;
        // Check if user is logged-in or not
        FB.getLoginStatus(function(response) {
            //Emre: facebook changed "response" properties (57298)
            if (response.authResponse) { // user is already logged in
                JotForm.FBCollectInformation(response.authResponse.userID);
            } else {    // user is not logged in. "JotForm.FBCollectInformation" is binded to facebook login event.
                FB.Event.subscribe('auth.login', function(response) {
                    JotForm.FBCollectInformation(response.authResponse.userID);
                });
            }
        });
    },
    /**
     * Request the logged-in users information from Facebook and populate hidden fields
     * Enable submit buttons and remove description
     */
    FBCollectInformation: function(id){
        JotForm.FBNoSubmit = false; // Enable submit buttons
        
        // Seek through all hidden FB inputs on the form to collect Requested
        // User information fields. Merge all field data with fields ID so we can put the
        // Associated data into correct input.
        // f is for form field id in DOM, d is for facebook db column name.
        var fls = $$('.form-helper').collect(function(el){ 
            var f = "";
            var d = el.readAttribute('data-info').replace("user_", ""); // Remove user_ prefix because it's not in the
            // Some permission names are different than FB users table
            // So we have to fix them
            switch(d){
                case "location":
                    f = "current_location";
                break;
                case "can_be_anyvalue": // for demoing
                    f = "place correct one here";
                break;
                default:
                    f = d;
            }
            return [f, el.id];
        });
        // Convert fls array to key value pair for easier and faster matching
        var fields = {};
        $A(fls).each(function(p){ fields[p[0]] = p[1]; });
        
        try{
            var columns = $H(fields).keys().join(", ");
            var query = FB.Data.query('SELECT '+columns+' FROM user WHERE uid={0}', id);
            
            query.wait(function(rows) {
                var inp;
                // 0th row has the query result we'll loop through results
                // and place existing fields into correct inputs
                $H(rows[0]).each(function(pair){
                    if( ( inp = $(fields[pair.key]) ) ){
                        // Some values must be converted to string before putting into fields
                        switch(pair.key){
                            case "current_location":
                                inp.value = pair.value.name;
                            break;
                            case "website":
                                inp.value = pair.value.split(/\s+/).join(", ");
                            break;
                            default:
                                inp.value = pair.value;
                        }
                    }
                });
                
                JotForm.bringOldFBSubmissionBack(id);
                
                var hidden = new Element('input', {type:'hidden', name:'fb_user_id'}).setValue(id);
                var form = JotForm.getForm(inp);
                form.insert({top:hidden});
            });
        }catch(e){
            console.error(e);
        }
        
        // Hide label description and display Submit buttons
        // Because user has completed the FB login operation and we have collected the info
        $$('.fb-login-buttons').invoke('show');
        $$('.fb-login-label').invoke('hide');
    },
    
    bringOldFBSubmissionBack: function(id){
        
        var formIDField = $$('input[name="formID"]')[0];
        
        var a = new Ajax.Jsonp(JotForm.url+'server.php', {
            parameters: {
                action: 'bringOldFBSubmissionBack',
                formID: formIDField.value,
                fbid: id
            },
            evalJSON: 'force',
            onComplete: function(t){
                var res = t.responseJSON;
                if (res.success) {
                    JotForm.editMode(res, true, ['control_helper', 'control_fileupload']); // Don't reset fields
                }
            }
        });
    },

    /**
     *  Placeholder for a deleted function to prevent script errors
     *  on forms saved in the past
     */
    
    hideSubmissionEmptyFields: function(formID) {
        
    },
    
    setCustomHint: function( elem, value )
    {
      var element = $(elem) || null,
          new_value = value.replace(/<br>/gim, "\n") || "";//replace any br to \n

      //add a class to the control to denote that is using a custom hint
      //as well as write the custom hint into the data-hint attrib
      element.addClassName('custom-hint-group').writeAttribute('data-customhint', value).writeAttribute('customhinted', "true");

      //set that the control has no content
      //check if it has a content, especially default data
      element.hasContent = ( element.value && element.value.replace(/\n/gim, "<br>") != value ) ? true : false;

      //function to show the custom placeholder
      element.showCustomPlaceHolder = function()
      {
        if( !this.hasContent )
        {
          this.value = new_value;
          //exclude spellcheck onto the control
          this.writeAttribute("spellcheck", "false").addClassName('form-custom-hint');
        }
      };

      //function to hide the custom placeholder
      element.hideCustomPlaceHolder = function()
      {
        if( !this.hasContent )
        {
          this.value = "";
          //exclude spellcheck onto the control
          this.removeClassName('form-custom-hint').removeAttribute('spellcheck');
        }
      };

      //add events to the control
      element.observe('focus',function(e){
          this.hideCustomPlaceHolder();
      }).observe('blur', function(e){
          this.showCustomPlaceHolder();
      }).observe('keyup', function(e){
          //this will determine if the control has a value
          this.hasContent = ( this.value.length > 0 ) ? true : false;
      });

      //catch the submission of a form, and remove all custom placeholder
      //since we are using the said trick, this needs to be done
      element.up('form.jotform-form').observe('submit',function(){
        this.select('.custom-hint-group').each(function(elem){
          elem.hideCustomPlaceHolder();
        });
      });

      //initiate the custom placeholders
      element.showCustomPlaceHolder();

    },

    /*
    ** Return true if field has any kind of content - user inputted or otherwise and does not have error
    */
    fieldHasContent: function(id) {
        
        if($('id_'+id).hasClassName('form-line-error')) return false;
        if($('id_'+id).select('.form-custom-hint').length > 0) return false;

        var type = JotForm.getInputType(id);
        switch(type){
            case "address":
            case "combined":
                return $$('#id_'+id+' input').collect(function(e){ return e.value; }).any();
            case "number":
                return $$('#id_'+id+' input').collect(function(e){ return e.value && e.value != 0; }).any();
            case "birthdate":
                return JotForm.getBirthDate(id);
            case "datetime":
                var date = JotForm.getDateValue(id); 
                return !(date == "T00:00" || date == '');
            case "time":
                return JotForm.get24HourTime(id);
            case "checkbox":
            case "radio":
                return $$('#id_'+id+' input').collect(function(e){ return e.checked; }).any();
            case "select":
                return $$('#id_'+id+' select').collect(function(e){ return e.value; }).any();
            case "grading":
                return $$('input[id^=input_' + id +'_]').collect(function(e){ return e.value; }).any();
            case "signature":
                return jQuery("#id_" + id).find(".pad").jSignature('getData','base30')[1].length > 0;
            case "slider":
                return $('input_'+id).value > 0;
            case "file":
                if($$('#id_'+id+' input')[0].readAttribute('multiple') === 'multiple') {
                    return $('id_'+id).select('.qq-upload-list li').length > 0;
                } else {
                    return $('input_'+id).value;
                }
                break;
            default:
                if($('input_'+id) && $('input_'+id).value) {
                    return $('input_'+id).value;
                } else {
                    return false;
                }

        }
    },

    /*
    ** Show progress bar on screen and set up listeners
    */
    setupProgressBar: function() {
        JotForm.progressBar = new ProgressBar("progressBar", {'height':'20px', 'width': '95%'});
        var countFields = ['select','radio','checkbox','file','combined','email','address','combined','datetime','time',
        'birthdate','number','radio','number','radio','autocomplete','radio','text','textarea','signature', 'div', 'slider'];
        var totalFields = 0;
        var completedFields = 0;

        var updateProgress = function() {
            completedFields = 0;
            $$('.form-line').each(function(el) {
                var id = el.id.split("_")[1];
                var type = JotForm.getInputType(id);
                if($A(countFields).include(type)) {
                    if(JotForm.fieldHasContent(id)) {
                        completedFields++;
                    }
                }
            });

            var percentage = parseInt(100/totalFields*completedFields);
            if(isNaN(percentage)) percentage = 0;
            JotForm.progressBar.setPercent(percentage);
            $('progressPercentage').update(percentage + '% ');
            $('progressCompleted').update(completedFields);
            if(percentage == 100) {
                $('progressSubmissionReminder').show();
            } else {
                $('progressSubmissionReminder').hide();
            }
        };

        var setListener = function(el, ev) {
            $(el).observe(ev, function() {
                updateProgress();
            });
        };        

        $$('.form-line').each(function(el) {
            var id = el.id.split("_")[1];
            var type = JotForm.getInputType(id);
            if(!countFields.include(type)) {
                return;
            }

            totalFields++;
            switch (type) {
                case 'radio':
                case 'checkbox':
                    setListener($('id_' + id), 'click');
                    break;
                
                case 'select':
                case 'file':
                    setListener($('id_' + id), 'change');
                    break;
                
                case 'datetime':
                    setListener($('id_' + id), 'date:changed');
                    $$("#id_" + id + ' select').each(function(el) {
                        setListener($(el), 'change');
                    });
                    break;
                
                case 'time':
                case 'birthdate':
                    $$("#id_" + id + ' select').each(function(el) {
                        setListener($(el), 'change');
                    });                        
                    break;

                case 'address':
                    setListener($('id_' + id), 'keyup');
                    break;

                case 'number':
                    setListener($('id_' + id), 'keyup');
                    setListener($('id_' + id), 'click');
                    break;

                case 'signature':
                    setListener($('id_' + id), 'click');
                    break;

                default:
                    setListener($('id_' + id), 'keyup');
                    break;
            }
        });
        $('progressTotal').update(totalFields);

        updateProgress();
    },

    /**
     * Responsible on handling AutoFill feature,
     * this will also help to ensure that it will not conflict
     * on customHint trick if any
     */
    autoFillInitialize: function( params )
    {
      //initialize autoFill plugin for jquery
      var formID = $$('input[name="formID"]')[0].value;
      params.name = 'form_' + formID;
      var _form = 'form#' + formID;
      var form   = $$(_form)[0];

      //write an attribute to the form denoting that it uses a autoFill
      form.writeAttribute('data-autofill', 'true');

      /**
       * Will handle conflicts of the autoFill
       * especially custom hints, grading total computation
       */
      var _conflicts = {
        _handleCustomHint: function( data )
        {
          //get the data that was generated in the autoFill plugin
          var pfields = data.protectedfields;
          var pfieldsdata = data.protectedfieldsdata;
          var inc = 0;

          //loop through the stored data
          $H( pfieldsdata ).each(function(_fielddata){

            var _field = pfields[inc];
            var field = $(_field);
            var fieldata = _fielddata[1];

            //get the value on where the data is restored
            var value = ( fieldata.newinputvalue ) ? fieldata.newinputvalue.replace(/\n/gim, "<br>") : false;

            if( field.hasAttribute('data-customhint') || field.hasAttribute('customhinted') )
            {
              //get the value of the element
              var hint = field.readAttribute('data-customhint');

              // alert('customhinted:' + hint " | " + value);
              if( hint && value && hint != value ) {
                field.removeClassName('form-custom-hint');
                field.hasContent = true;
              }
            }
            else if( field.hasAttribute('hinted') || field.hinted ) //this is for IE relateds
            {
              //get the old input value and compare it to the newvalue of the input
              //if not match turn the color of the hint to black
              //seems to be a bug when using the .hint() function in IE
              var hint = ( fieldata.oldinputvalue ) ? fieldata.oldinputvalue.replace(/\n/gim, "<br>") : false;

              // alert('hinted:' + hint " | " + value);
              if( hint && value && hint != value ) {
                field.setStyle({color: "#000"});
              }
            }

            inc++;
          });
        },
        /**
        * Will handle the total of grading inputs if set
        */
        _handleGradingTotal: function( data )
        {
          if( $$('.form-grading-input').length > 0 && $("grade_total_" + id))
          {
            var total = 0, id = null;
            $$('.form-grading-input').each(function(input){
              id = input.id.replace(/input_(\d+)_\d+/, "$1"),
              total += parseFloat(input.value) || 0;
            });

            $("grade_point_" + id).innerHTML = total;
          }
        }
      };

      //initiate jquery autoFill
      jQuery( _form ).autoFill({
        timeout: ( Number(params.timeout) > 0 ) ? params.timeout : 4,
        excludeFields: ["formID", "simple_spc", "temp_upload_folder"],
        ttl: params.ttl,
        allowBindOnChange: (params.bindChange && params.bindChange == 'on') ? true : false,
        onBeforeSave: function() {},
        onSave: function() {},
        onRelease: function() {},
        onBeforeRestore: function() {},
        onRestore: function(data)
        {
          //check for custom hints
          var restoredDatas = this.restoredData[0];
          // console.log( restoredDatas );
          if( restoredDatas )
          {
            //resolve conflicts in customHint if any
            _conflicts._handleCustomHint( restoredDatas );

            //resolve grading total computation if any
            _conflicts._handleGradingTotal( restoredDatas );
          }
        }
      });

      this.autoFillDeployed = true;
    },

    /**
     * Set masking for an specific question question
     * supports input type='text' only
     */
    setQuestionMasking: function( toSelector, type, maskValue, unmask )
    {
      var unmask = ( unmask ) ? unmask : false
        , extendedMask = {};

      //extend the definitions to accept other characters
      extendedMask['#'] = {
        validator: "[0-9]",
        cardinality: 1
      };

      //include more mask options for specific questions
      if ( type === "textMasking" )
      {
        extendedMask['@'] = {
          validator: "[A-Za-z\u0410-\u044F\u0401\u0451]",
          cardinality: 1
        };
      }

      jQuery.extend(jQuery.inputmask.defaults.definitions, extendedMask);

      //initiate masking for phones.
      if( unmask )
      {
        jQuery( toSelector ).inputmask('remove');
      }
      else
      {
        jQuery( toSelector ).inputmask( maskValue, { "placeholder": "_" } );
      }
    },

    /**
     * Helper that will handle input masking
     * this depends on the users masking format
     */
    setInputTextMasking: function( elem, maskValue, unmask )
    {
        setTimeout(function() { //wait for prepopulations to be run before setting the mask
            JotForm.setQuestionMasking( "#" + elem, 'textMasking', maskValue, unmask );
        }, 10);
    },

    /**
     * Will handle the Phone Validation
     * this depends on the users masking format
     */
    setPhoneMaskingValidator: function( elem, maskValue, unmask )
    {
        setTimeout(function() { //wait for prepopulations to be run before setting the mask
            JotForm.setQuestionMasking( "#" + elem, 'phoneMasking', maskValue, unmask );
        }, 10);
    }
};
function getQuerystring(key, default_){
  if (default_==null) default_=""; 
  key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regex = new RegExp("[\\?&]"+key+"=([^&#]*)");
  var qs = regex.exec(window.location.href);
  if(qs == null)
    return default_;
  else
    return qs[1];
}
// We have to put this event because it's the only way to catch FB load
window.fbAsyncInit = JotForm.FBInit.bind(JotForm);

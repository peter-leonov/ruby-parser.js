class ApplicationController < ActionController::Base
  protect_from_forgery
end
class CommentsController < ApplicationController
	http_basic_authenticate_with :name => "dhh", :password => "secret", :only => :destroy
  def create
    @post = Post.find(params[:post_id])
    @comment = @post.comments.create(params[:comment])
    redirect_to post_path(@post)
  end
 
  def destroy
    @post = Post.find(params[:post_id])
    @comment = @post.comments.find(params[:id])
    @comment.destroy
    redirect_to post_path(@post)
  end
 
end
class HomeController < ApplicationController
  def index
  end

end
class PostsController < ApplicationController
  http_basic_authenticate_with :name => "dhh", :password => "secret", :except => :index
  # GET /posts
  # GET /posts.json
  def index
    @posts = Post.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @posts }
    end
  end

  # GET /posts/1
  # GET /posts/1.json
  def show
    @post = Post.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @post }
    end
  end

  # GET /posts/new
  # GET /posts/new.json
  def new
    @post = Post.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @post }
    end
  end

  # GET /posts/1/edit
  def edit
    @post = Post.find(params[:id])
  end

  # POST /posts
  # POST /posts.json
  def create
    @post = Post.new(params[:post])

    respond_to do |format|
      if @post.save
        format.html { redirect_to @post, notice: 'Post was successfully created.' }
        format.json { render json: @post, status: :created, location: @post }
      else
        format.html { render action: "new" }
        format.json { render json: @post.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /posts/1
  # PUT /posts/1.json
  def update
    @post = Post.find(params[:id])

    respond_to do |format|
      if @post.update_attributes(params[:post])
        format.html { redirect_to @post, notice: 'Post was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @post.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /posts/1
  # DELETE /posts/1.json
  def destroy
    @post = Post.find(params[:id])
    @post.destroy

    respond_to do |format|
      format.html { redirect_to posts_url }
      format.json { head :no_content }
    end
  end
end
module ApplicationHelper
end
module CommentsHelper
end
module HomeHelper
end
module PostsHelper
  def join_tags(post)
    post.tags.map { |t| t.name }.join(", ")
  end
end
class Comment < ActiveRecord::Base
  belongs_to :post
end
class Post < ActiveRecord::Base
  validates :name,  :presence => true
  validates :title, :presence => true,
                    :length => { :minimum => 5 }
 
  has_many :comments, :dependent => :destroy
  has_many :tags
 
  accepts_nested_attributes_for :tags, :allow_destroy => :true,
    :reject_if => proc { |attrs| attrs.all? { |k, v| v.blank? } }
end
class Tag < ActiveRecord::Base
  belongs_to :post
end
require File.expand_path('../boot', __FILE__)

require 'rails/all'

if defined?(Bundler)
  # If you precompile assets before deploying to production, use this line
  Bundler.require(*Rails.groups(:assets => %w(development test)))
  # If you want your assets lazily compiled in production, use this line
  # Bundler.require(:default, :assets, Rails.env)
end

module Blog
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Custom directories with classes and modules you want to be autoloadable.
    # config.autoload_paths += %W(#{config.root}/extras)

    # Only load the plugins named here, in the order given (default is alphabetical).
    # :all can be used as a placeholder for all plugins not explicitly named.
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

    # Activate observers that should always be running.
    # config.active_record.observers = :cacher, :garbage_collector, :forum_observer

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # Configure the default encoding used in templates for Ruby 1.9.
    config.encoding = "utf-8"

    # Configure sensitive parameters which will be filtered from the log file.
    config.filter_parameters += [:password]

    # Use SQL instead of Active Record's schema dumper when creating the database.
    # This is necessary if your schema can't be completely dumped by the schema dumper,
    # like if you have constraints or database-specific column types
    # config.active_record.schema_format = :sql

    # Enforce whitelist mode for mass assignment.
    # This will create an empty whitelist of attributes available for mass-assignment for all models
    # in your app. As such, your models will need to explicitly whitelist or blacklist accessible
    # parameters by using an attr_accessible or attr_protected declaration.
    # config.active_record.whitelist_attributes = true

    # Enable the asset pipeline
    config.assets.enabled = true

    # Version of your assets, change this if you want to expire all your assets
    config.assets.version = '1.0'
  end
end
require 'rubygems'

# Set up gems listed in the Gemfile.
ENV['BUNDLE_GEMFILE'] ||= File.expand_path('../../Gemfile', __FILE__)

require 'bundler/setup' if File.exists?(ENV['BUNDLE_GEMFILE'])
# Load the rails application
require File.expand_path('../application', __FILE__)

# Initialize the rails application
Blog::Application.initialize!
Blog::Application.configure do
  # Settings specified here will take precedence over those in config/application.rb

  # In the development environment your application's code is reloaded on
  # every request.  This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Log error messages when you accidentally call methods on nil.
  config.whiny_nils = true

  # Show full error reports and disable caching
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false

  # Don't care if the mailer can't send
  config.action_mailer.raise_delivery_errors = false

  # Print deprecation notices to the Rails logger
  config.active_support.deprecation = :log

  # Only use best-standards-support built into browsers
  config.action_dispatch.best_standards_support = :builtin

  # Raise exception on mass assignment protection for ActiveRecord models
  config.active_record.mass_assignment_sanitizer = :strict

  # Log the query plan for queries taking more than this (works
  # with SQLite, MySQL, and PostgreSQL)
  config.active_record.auto_explain_threshold_in_seconds = 0.5

  # Do not compress assets
  config.assets.compress = false

  # Expands the lines which load the assets
  config.assets.debug = true
end
Blog::Application.configure do
  # Settings specified here will take precedence over those in config/application.rb

  # Code is not reloaded between requests
  config.cache_classes = true

  # Full error reports are disabled and caching is turned on
  config.consider_all_requests_local       = false
  config.action_controller.perform_caching = true

  # Disable Rails's static asset server (Apache or nginx will already do this)
  config.serve_static_assets = false

  # Compress JavaScripts and CSS
  config.assets.compress = true

  # Don't fallback to assets pipeline if a precompiled asset is missed
  config.assets.compile = false

  # Generate digests for assets URLs
  config.assets.digest = true

  # Defaults to Rails.root.join("public/assets")
  # config.assets.manifest = YOUR_PATH

  # Specifies the header that your server uses for sending files
  # config.action_dispatch.x_sendfile_header = "X-Sendfile" # for apache
  # config.action_dispatch.x_sendfile_header = 'X-Accel-Redirect' # for nginx

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  # config.force_ssl = true

  # See everything in the log (default is :info)
  # config.log_level = :debug

  # Prepend all log lines with the following tags
  # config.log_tags = [ :subdomain, :uuid ]

  # Use a different logger for distributed setups
  # config.logger = ActiveSupport::TaggedLogging.new(SyslogLogger.new)

  # Use a different cache store in production
  # config.cache_store = :mem_cache_store

  # Enable serving of images, stylesheets, and JavaScripts from an asset server
  # config.action_controller.asset_host = "http://assets.example.com"

  # Precompile additional assets (application.js, application.css, and all non-JS/CSS are already added)
  # config.assets.precompile += %w( search.js )

  # Disable delivery errors, bad email addresses will be ignored
  # config.action_mailer.raise_delivery_errors = false

  # Enable threaded mode
  # config.threadsafe!

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation can not be found)
  config.i18n.fallbacks = true

  # Send deprecation notices to registered listeners
  config.active_support.deprecation = :notify

  # Log the query plan for queries taking more than this (works
  # with SQLite, MySQL, and PostgreSQL)
  # config.active_record.auto_explain_threshold_in_seconds = 0.5
end
Blog::Application.configure do
  # Settings specified here will take precedence over those in config/application.rb

  # The test environment is used exclusively to run your application's
  # test suite.  You never need to work with it otherwise.  Remember that
  # your test database is "scratch space" for the test suite and is wiped
  # and recreated between test runs.  Don't rely on the data there!
  config.cache_classes = true

  # Configure static asset server for tests with Cache-Control for performance
  config.serve_static_assets = true
  config.static_cache_control = "public, max-age=3600"

  # Log error messages when you accidentally call methods on nil
  config.whiny_nils = true

  # Show full error reports and disable caching
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false

  # Raise exceptions instead of rendering exception templates
  config.action_dispatch.show_exceptions = false

  # Disable request forgery protection in test environment
  config.action_controller.allow_forgery_protection    = false

  # Tell Action Mailer not to deliver emails to the real world.
  # The :test delivery method accumulates sent emails in the
  # ActionMailer::Base.deliveries array.
  config.action_mailer.delivery_method = :test

  # Raise exception on mass assignment protection for Active Record models
  config.active_record.mass_assignment_sanitizer = :strict

  # Print deprecation notices to the stderr
  config.active_support.deprecation = :stderr
end
# Be sure to restart your server when you modify this file.

# You can add backtrace silencers for libraries that you're using but don't wish to see in your backtraces.
# Rails.backtrace_cleaner.add_silencer { |line| line =~ /my_noisy_library/ }

# You can also remove all the silencers if you're trying to debug a problem that might stem from framework code.
# Rails.backtrace_cleaner.remove_silencers!
# Be sure to restart your server when you modify this file.

# Add new inflection rules using the following format
# (all these examples are active by default):
# ActiveSupport::Inflector.inflections do |inflect|
#   inflect.plural /^(ox)$/i, '\1en'
#   inflect.singular /^(ox)en/i, '\1'
#   inflect.irregular 'person', 'people'
#   inflect.uncountable %w( fish sheep )
# end
#
# These inflection rules are supported but not enabled by default:
# ActiveSupport::Inflector.inflections do |inflect|
#   inflect.acronym 'RESTful'
# end
# Be sure to restart your server when you modify this file.

# Add new mime types for use in respond_to blocks:
# Mime::Type.register "text/richtext", :rtf
# Mime::Type.register_alias "text/html", :iphone
# Be sure to restart your server when you modify this file.

# Your secret key for verifying the integrity of signed cookies.
# If you change this key, all old signed cookies will become invalid!
# Make sure the secret is at least 30 characters and all random,
# no regular words or you'll be exposed to dictionary attacks.
Blog::Application.config.secret_token = '685a9bf865b728c6549a191c90851c1b5ec41ecb60b9e94ad79dd3f824749798aa7b5e94431901960bee57809db0947b481570f7f13376b7ca190fa28099c459'
# Be sure to restart your server when you modify this file.

Blog::Application.config.session_store :cookie_store, key: '_blog_session'

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rails generate session_migration")
# Blog::Application.config.session_store :active_record_store
# Be sure to restart your server when you modify this file.
#
# This file contains settings for ActionController::ParamsWrapper which
# is enabled by default.

# Enable parameter wrapping for JSON. You can disable this by setting :format to an empty array.
ActiveSupport.on_load(:action_controller) do
  wrap_parameters format: [:json]
end

# Disable root element in JSON by default.
ActiveSupport.on_load(:active_record) do
  self.include_root_in_json = false
end
Blog::Application.routes.draw do
  resources :posts do
    resources :comments
  end

  get "home/index"

  # The priority is based upon order of creation:
  # first created -> highest priority.

  # Sample of regular route:
  #   match 'products/:id' => 'catalog#view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', :on => :collection
  #     end
  #   end

  # Sample resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end

  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.
  root :to => "home#index"
  
  # See how all your routes lay out with "rake routes"

  # This is a legacy wild controller route that's not recommended for RESTful applications.
  # Note: This route will make all actions in every controller accessible via GET requests.
  # match ':controller(/:action(/:id))(.:format)'
end
class CreatePosts < ActiveRecord::Migration
  def change
    create_table :posts do |t|
      t.string :name
      t.string :title
      t.text :content

      t.timestamps
    end
  end
end
class CreateComments < ActiveRecord::Migration
  def change
    create_table :comments do |t|
      t.string :commenter
      t.text :body
      t.references :post

      t.timestamps
    end
    add_index :comments, :post_id
  end
end
class CreateTags < ActiveRecord::Migration
  def change
    create_table :tags do |t|
      t.string :name
      t.references :post

      t.timestamps
    end
    add_index :tags, :post_id
  end
end
# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20110901013701) do

  create_table "comments", :force => true do |t|
    t.string   "commenter"
    t.text     "body"
    t.integer  "post_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "comments", ["post_id"], :name => "index_comments_on_post_id"

  create_table "posts", :force => true do |t|
    t.string   "name"
    t.string   "title"
    t.text     "content"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "tags", :force => true do |t|
    t.string   "name"
    t.integer  "post_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "tags", ["post_id"], :name => "index_tags_on_post_id"

end
# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)
require 'test_helper'

class CommentsControllerTest < ActionController::TestCase
  # test "the truth" do
  #   assert true
  # end
end
require 'test_helper'

class HomeControllerTest < ActionController::TestCase
  test "should get index" do
    get :index
    assert_response :success
  end

end
require 'test_helper'

class PostsControllerTest < ActionController::TestCase
  setup do
    @post = posts(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:posts)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create post" do
    assert_difference('Post.count') do
      post :create, post: @post.attributes
    end

    assert_redirected_to post_path(assigns(:post))
  end

  test "should show post" do
    get :show, id: @post.to_param
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @post.to_param
    assert_response :success
  end

  test "should update post" do
    put :update, id: @post.to_param, post: @post.attributes
    assert_redirected_to post_path(assigns(:post))
  end

  test "should destroy post" do
    assert_difference('Post.count', -1) do
      delete :destroy, id: @post.to_param
    end

    assert_redirected_to posts_path
  end
end
require 'test_helper'
require 'rails/performance_test_help'

class BrowsingTest < ActionDispatch::PerformanceTest
  # Refer to the documentation for all available options
  # self.profile_options = { :runs => 5, :metrics => [:wall_time, :memory]
  #                          :output => 'tmp/performance', :formats => [:flat] }

  def test_homepage
    get '/'
  end
end
ENV["RAILS_ENV"] = "test"
require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

class ActiveSupport::TestCase
  # Setup all fixtures in test/fixtures/*.(yml|csv) for all tests in alphabetical order.
  #
  # Note: You'll currently still have to declare fixtures explicitly in integration tests
  # -- they do not yet inherit this setting
  fixtures :all

  # Add more helper methods to be used by all tests here...
end
require 'test_helper'

class CommentTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
require 'test_helper'

class CommentsHelperTest < ActionView::TestCase
end
require 'test_helper'

class HomeHelperTest < ActionView::TestCase
end
require 'test_helper'

class PostsHelperTest < ActionView::TestCase
end
require 'test_helper'

class PostTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
require 'test_helper'

class TagTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
# ---------------------------------------------------------------------------
#
# This script generates the guides. It can be invoked either directly or via the
# generate_guides rake task within the railties directory.
#
# Guides are taken from the source directory, and the resulting HTML goes into the
# output directory. Assets are stored under files, and copied to output/files as
# part of the generation process.
#
# Some arguments may be passed via environment variables:
#
#   WARNINGS
#     If you are writing a guide, please work always with WARNINGS=1. Users can
#     generate the guides, and thus this flag is off by default.
#
#     Internal links (anchors) are checked. If a reference is broken levenshtein
#     distance is used to suggest an existing one. This is useful since IDs are
#     generated by Textile from headers and thus edits alter them.
#
#     Also detects duplicated IDs. They happen if there are headers with the same
#     text. Please do resolve them, if any, so guides are valid XHTML.
#
#   ALL
#    Set to "1" to force the generation of all guides.
#
#   ONLY
#     Use ONLY if you want to generate only one or a set of guides. Prefixes are
#     enough:
#
#       # generates only association_basics.html
#       ONLY=assoc ruby rails_guides.rb
#
#     Separate many using commas:
#
#       # generates only association_basics.html and migrations.html
#       ONLY=assoc,migrations ruby rails_guides.rb
#
#     Note that if you are working on a guide generation will by default process
#     only that one, so ONLY is rarely used nowadays.
#
#   GUIDES_LANGUAGE
#     Use GUIDES_LANGUAGE when you want to generate translated guides in
#     <tt>source/<GUIDES_LANGUAGE></tt> folder (such as <tt>source/es</tt>).
#     Ignore it when generating English guides.
#
#   EDGE
#     Set to "1" to indicate generated guides should be marked as edge. This
#     inserts a badge and changes the preamble of the home page.
#
#   KINDLE
#     Set to "1" to generate the .mobi with all the guides. The kindlegen
#     executable must be in your PATH. You can get it for free from
#     http://www.amazon.com/kindlepublishing
#
# ---------------------------------------------------------------------------

require 'set'
require 'fileutils'

require 'active_support/core_ext/string/output_safety'
require 'active_support/core_ext/object/blank'
require 'action_controller'
require 'action_view'

require 'rails_guides/indexer'
require 'rails_guides/helpers'
require 'rails_guides/levenshtein'

module RailsGuides
  class Generator
    attr_reader :guides_dir, :source_dir, :output_dir, :edge, :warnings, :all

    GUIDES_RE = /\.(?:textile|erb)$/

    def initialize(output=nil)
      set_flags_from_environment

      if kindle?
        check_for_kindlegen
        register_kindle_mime_types
      end

      initialize_dirs(output)
      create_output_dir_if_needed
    end

    def set_flags_from_environment
      @edge     = ENV['EDGE']     == '1'
      @warnings = ENV['WARNINGS'] == '1'
      @all      = ENV['ALL']      == '1'
      @kindle   = ENV['KINDLE']   == '1'
      @version  = ENV['RAILS_VERSION'] || `git rev-parse --short HEAD`.chomp
      @lang     = ENV['GUIDES_LANGUAGE']
    end

    def register_kindle_mime_types
      Mime::Type.register_alias("application/xml", :opf, %w(opf))
      Mime::Type.register_alias("application/xml", :ncx, %w(ncx))
    end

    def generate
      generate_guides
      copy_assets
      generate_mobi if kindle?
    end

    private

    def kindle?
      @kindle
    end

    def check_for_kindlegen
      if `which kindlegen`.blank?
        raise "Can't create a kindle version without `kindlegen`."
      end
    end

    def generate_mobi
      opf = "#{output_dir}/rails_guides.opf"
      out = "#{output_dir}/kindlegen.out"

      system "kindlegen #{opf} -o #{mobi} > #{out} 2>&1"
      puts "Guides compiled as Kindle book to #{mobi}"
      puts "(kindlegen log at #{out})."
    end

    def mobi
      "ruby_on_rails_guides_#@version%s.mobi" % (@lang.present? ? ".#@lang" : '')
    end

    def initialize_dirs(output)
      @guides_dir = File.join(File.dirname(__FILE__), '..')
      @source_dir = "#@guides_dir/source/#@lang"
      @output_dir = if output
        output
      elsif kindle?
        "#@guides_dir/output/kindle/#@lang"
      else
        "#@guides_dir/output/#@lang"
      end.sub(%r</$>, '')
    end

    def create_output_dir_if_needed
      FileUtils.mkdir_p(output_dir)
    end

    def generate_guides
      guides_to_generate.each do |guide|
        output_file = output_file_for(guide)
        generate_guide(guide, output_file) if generate?(guide, output_file)
      end
    end

    def guides_to_generate
      guides = Dir.entries(source_dir).grep(GUIDES_RE)

      if kindle?
        Dir.entries("#{source_dir}/kindle").grep(GUIDES_RE).map do |entry|
          guides << "kindle/#{entry}"
        end
      end

      ENV.key?('ONLY') ? select_only(guides) : guides
    end

    def select_only(guides)
      prefixes = ENV['ONLY'].split(",").map(&:strip)
      guides.select do |guide|
        prefixes.any? {|p| guide.start_with?(p)}
      end
    end

    def copy_assets
      FileUtils.cp_r(Dir.glob("#{guides_dir}/assets/*"), output_dir)
    end

    def output_file_for(guide)
      if guide =~/\.textile$/
        guide.sub(/\.textile$/, '.html')
      else
        guide.sub(/\.erb$/, '')
      end
    end

    def output_path_for(output_file)
      File.join(output_dir, File.basename(output_file))
    end

    def generate?(source_file, output_file)
      fin  = File.join(source_dir, source_file)
      fout = output_path_for(output_file)
      all || !File.exists?(fout) || File.mtime(fout) < File.mtime(fin)
    end

    def generate_guide(guide, output_file)
      output_path = output_path_for(output_file)
      puts "Generating #{guide} as #{output_file}"
      layout = kindle? ? 'kindle/layout' : 'layout'

      File.open(output_path, 'w') do |f|
        view = ActionView::Base.new(source_dir, :edge => @edge, :version => @version, :mobi => "kindle/#{mobi}")
        view.extend(Helpers)

        if guide =~ /\.(\w+)\.erb$/
          # Generate the special pages like the home.
          # Passing a template handler in the template name is deprecated. So pass the file name without the extension.
          result = view.render(:layout => layout, :formats => [$1], :file => $`)
        else
          body = File.read(File.join(source_dir, guide))
          body = set_header_section(body, view)
          body = set_index(body, view)

          result = view.render(:layout => layout, :text => textile(body))

          warn_about_broken_links(result) if @warnings
        end

        f.write(result)
      end
    end

    def set_header_section(body, view)
      new_body = body.gsub(/(.*?)endprologue\./m, '').strip
      header = $1

      header =~ /h2\.(.*)/
      page_title = "Ruby on Rails Guides: #{$1.strip}"

      header = textile(header)

      view.content_for(:page_title) { page_title.html_safe }
      view.content_for(:header_section) { header.html_safe }
      new_body
    end

    def set_index(body, view)
      index = <<-INDEX
      <div id="subCol">
        <h3 class="chapter"><img src="images/chapters_icon.gif" alt="" />Chapters</h3>
        <ol class="chapters">
      INDEX

      i = Indexer.new(body, warnings)
      i.index

      # Set index for 2 levels
      i.level_hash.each do |key, value|
        link = view.content_tag(:a, :href => key[:id]) { textile(key[:title], true).html_safe }

        children = value.keys.map do |k|
          view.content_tag(:li,
            view.content_tag(:a, :href => k[:id]) { textile(k[:title], true).html_safe })
        end

        children_ul = children.empty? ? "" : view.content_tag(:ul, children.join(" ").html_safe)

        index << view.content_tag(:li, link.html_safe + children_ul.html_safe)
      end

      index << '</ol>'
      index << '</div>'

      view.content_for(:index_section) { index.html_safe }

      i.result
    end

    def textile(body, lite_mode=false)
      t = RedCloth.new(body)
      t.hard_breaks = false
      t.lite_mode = lite_mode
      t.to_html(:notestuff, :plusplus, :code)
    end

    def warn_about_broken_links(html)
      anchors = extract_anchors(html)
      check_fragment_identifiers(html, anchors)
    end

    def extract_anchors(html)
      # Textile generates headers with IDs computed from titles.
      anchors = Set.new
      html.scan(/<h\d\s+id="([^"]+)/).flatten.each do |anchor|
        if anchors.member?(anchor)
          puts "*** DUPLICATE ID: #{anchor}, please put and explicit ID, e.g. h4(#explicit-id), or consider rewording"
        else
          anchors << anchor
        end
      end

      # Footnotes.
      anchors += Set.new(html.scan(/<p\s+class="footnote"\s+id="([^"]+)/).flatten)
      anchors += Set.new(html.scan(/<sup\s+class="footnote"\s+id="([^"]+)/).flatten)
      return anchors
    end

    def check_fragment_identifiers(html, anchors)
      html.scan(/<a\s+href="#([^"]+)/).flatten.each do |fragment_identifier|
        next if fragment_identifier == 'mainCol' # in layout, jumps to some DIV
        unless anchors.member?(fragment_identifier)
          guess = anchors.min { |a, b|
            Levenshtein.distance(fragment_identifier, a) <=> Levenshtein.distance(fragment_identifier, b)
          }
          puts "*** BROKEN LINK: ##{fragment_identifier}, perhaps you meant ##{guess}."
        end
      end
    end
  end
end
module RailsGuides
  module Helpers
    def guide(name, url, options = {}, &block)
      link = content_tag(:a, :href => url) { name }
      result = content_tag(:dt, link)

      if options[:work_in_progress]
        result << content_tag(:dd, 'Work in progress', :class => 'work-in-progress')
      end

      result << content_tag(:dd, capture(&block))
      result
    end

    def documents_by_section
      @documents_by_section ||= YAML.load_file(File.expand_path('../../source/documents.yaml', __FILE__))
    end

    def documents_flat
      documents_by_section.map {|section| section['documents']}.flatten
    end

    def finished_documents(documents)
      documents.reject { |document| document['work_in_progress'] }
    end

    def docs_for_menu(position)
      position == 'L' ? documents_by_section.to(3) : documents_by_section.from(4)
    end

    def author(name, nick, image = 'credits_pic_blank.gif', &block)
      image = "images/#{image}"

      result = content_tag(:img, nil, :src => image, :class => 'left pic', :alt => name, :width => 91, :height => 91)
      result << content_tag(:h3, name)
      result << content_tag(:p, capture(&block))
      content_tag(:div, result, :class => 'clearfix', :id => nick)
    end

    def code(&block)
      c = capture(&block)
      content_tag(:code, c)
    end
  end
end
require 'active_support/core_ext/object/blank'
require 'active_support/ordered_hash'
require 'active_support/core_ext/string/inflections'

module RailsGuides
  class Indexer
    attr_reader :body, :result, :warnings, :level_hash

    def initialize(body, warnings)
      @body     = body
      @result   = @body.dup
      @warnings = warnings
    end

    def index
      @level_hash = process(body)
    end

    private

    def process(string, current_level=3, counters=[1])
      s = StringScanner.new(string)

      level_hash = ActiveSupport::OrderedHash.new

      while !s.eos?
        re = %r{^h(\d)(?:\((#.*?)\))?\s*\.\s*(.*)$}
        s.match?(re)
        if matched = s.matched
          matched =~ re
          level, idx, title = $1.to_i, $2, $3.strip

          if level < current_level
            # This is needed. Go figure.
            return level_hash
          elsif level == current_level
            index = counters.join(".")
            idx ||= '#' + title_to_idx(title)

            raise "Parsing Fail" unless @result.sub!(matched, "h#{level}(#{idx}). #{index} #{title}")

            key = {
              :title => title,
              :id => idx
            }
            # Recurse
            counters << 1
            level_hash[key] = process(s.post_match, current_level + 1, counters)
            counters.pop

            # Increment the current level
            last = counters.pop
            counters << last + 1
          end
        end
        s.getch
      end
      level_hash
    end

    def title_to_idx(title)
      idx = title.strip.parameterize.sub(/^\d+/, '')
      if warnings && idx.blank?
        puts "BLANK ID: please put an explicit ID for section #{title}, as in h5(#my-id)"
      end
      idx
    end
  end
end
module RailsGuides
  module Levenshtein
    # Based on the pseudocode in http://en.wikipedia.org/wiki/Levenshtein_distance.
    def self.distance(s1, s2)
      s = s1.unpack('U*')
      t = s2.unpack('U*')
      m = s.length
      n = t.length

      # matrix initialization
      d = []
      0.upto(m) { |i| d << [i] }
      0.upto(n) { |j| d[0][j] = j }

      # distance computation
      1.upto(m) do |i|
        1.upto(n) do |j|
          cost = s[i] == t[j] ? 0 : 1
          d[i][j] = [
            d[i-1][j] + 1,      # deletion
            d[i][j-1] + 1,      # insertion
            d[i-1][j-1] + cost, # substitution
          ].min
        end
      end

      # all done
      return d[m][n]
    end
  end
end
require 'active_support/core_ext/object/inclusion'

module RailsGuides
  module TextileExtensions
    def notestuff(body)
      # The following regexp detects special labels followed by a
      # paragraph, perhaps at the end of the document.
      #
      # It is important that we do not eat more than one newline
      # because formatting may be wrong otherwise. For example,
      # if a bulleted list follows the first item is not rendered
      # as a list item, but as a paragraph starting with a plain
      # asterisk.
      body.gsub!(/^(TIP|IMPORTANT|CAUTION|WARNING|NOTE|INFO)[.:](.*?)(\n(?=\n)|\Z)/m) do |m|
        css_class = case $1
                    when 'CAUTION', 'IMPORTANT'
                      'warning'
                    when 'TIP'
                      'info'
                    else
                      $1.downcase
                    end
        %Q(<div class="#{css_class}"><p>#{$2.strip}</p></div>)
      end
    end

    def plusplus(body)
      body.gsub!(/\+(.*?)\+/) do |m|
        "<notextile><tt>#{$1}</tt></notextile>"
      end

      # The real plus sign
      body.gsub!('<plus>', '+')
    end

    def brush_for(code_type)
      case code_type
        when 'ruby', 'sql', 'plain'
          code_type
        when 'erb'
          'ruby; html-script: true'
        when 'html'
          'xml' # html is understood, but there are .xml rules in the CSS
        else
          'plain'
      end
    end

    def code(body)
      body.gsub!(%r{<(yaml|shell|ruby|erb|html|sql|plain)>(.*?)</\1>}m) do |m|
        <<HTML
<notextile>
<div class="code_container">
<pre class="brush: #{brush_for($1)}; gutter: false; toolbar: false">
#{ERB::Util.h($2).strip}
</pre>
</div>
</notextile>
HTML
      end
    end
  end
end
pwd = File.dirname(__FILE__)
$:.unshift pwd

# This is a predicate useful for the doc:guides task of applications.
def bundler?
  # Note that rake sets the cwd to the one that contains the Rakefile
  # being executed.
  File.exists?('Gemfile')
end

# Loading Action Pack requires rack and erubis.
require 'rubygems'

begin
  # Guides generation in the Rails repo.
  as_lib = File.join(pwd, "../../activesupport/lib")
  ap_lib = File.join(pwd, "../../actionpack/lib")

  $:.unshift as_lib if File.directory?(as_lib)
  $:.unshift ap_lib if File.directory?(ap_lib)
rescue LoadError
  # Guides generation from gems.
  gem "actionpack", '>= 3.0'
end

begin
  require 'redcloth'
rescue Gem::LoadError
  # This can happen if doc:guides is executed in an application.
  $stderr.puts('Generating guides requires RedCloth 4.1.1+.')
  $stderr.puts(<<ERROR) if bundler?
Please add

  gem 'RedCloth', '~> 4.2'

to the Gemfile, run

  bundle install

and try again.
ERROR

  exit 1
end

require "rails_guides/textile_extensions"
RedCloth.send(:include, RailsGuides::TextileExtensions)

require "rails_guides/generator"
RailsGuides::Generator.new.generate
# ---------------------------------------------------------------------------
#
# This script validates the generated guides against the W3C Validator.
#
# Guides are taken from the output directory, from where all .html files are
# submitted to the validator.
#
# This script is prepared to be launched from the railties directory as a rake task:
#
# rake validate_guides
#
# If nothing is specified, all files will be validated, but you can check just
# some of them using this environment variable:
#
#   ONLY
#     Use ONLY if you want to validate only one or a set of guides. Prefixes are
#     enough:
#
#       # validates only association_basics.html
#       ONLY=assoc rake validate_guides
#
#     Separate many using commas:
#
#       # validates only association_basics.html and migrations.html
#       ONLY=assoc,migrations rake validate_guides
#
# ---------------------------------------------------------------------------

require 'rubygems'
require 'w3c_validators'
include W3CValidators

module RailsGuides
  class Validator

    def validate
      validator = MarkupValidator.new
      STDOUT.sync = true
      errors_on_guides = {}

      guides_to_validate.each do |f|
        results = validator.validate_file(f)

        if results.validity
          print "."
        else
          print "E"
          errors_on_guides[f] = results.errors
        end
      end

      show_results(errors_on_guides)
    end

    private
    def guides_to_validate
      guides = Dir["./guides/output/*.html"]
      guides.delete("./guides/output/layout.html")
      ENV.key?('ONLY') ? select_only(guides) : guides
    end

    def select_only(guides)
      prefixes = ENV['ONLY'].split(",").map(&:strip)
      guides.select do |guide|
        prefixes.any? {|p| guide.start_with?("./guides/output/#{p}")}
      end
    end

    def show_results(error_list)
      if error_list.size == 0
        puts "\n\nAll checked guides validate OK!"
      else
        error_summary = error_detail = ""

        error_list.each_pair do |name, errors|
          error_summary += "\n  #{name}"
          error_detail += "\n\n  #{name} has #{errors.size} validation error(s):\n"
          errors.each do |error|
            error_detail += "\n    "+error.to_s.gsub("\n", "")
          end
        end

        puts "\n\nThere are #{error_list.size} guides with validation errors:\n" + error_summary
        puts "\nHere are the detailed errors for each guide:" + error_detail
      end
    end

  end
end

RailsGuides::Validator.new.validate
require "rails"

%w(
  active_record
  action_controller
  action_mailer
  active_resource
  rails/test_unit
  sprockets
).each do |framework|
  begin
    require "#{framework}/railtie"
  rescue LoadError
  end
end
require "active_support/notifications"
require "active_support/dependencies"
require "active_support/descendants_tracker"

module Rails
  class Application
    module Bootstrap
      include Initializable

      initializer :load_environment_hook, :group => :all do end

      initializer :load_active_support, :group => :all do
        require "active_support/all" unless config.active_support.bare
      end

      # Preload all frameworks specified by the Configuration#frameworks.
      # Used by Passenger to ensure everything's loaded before forking and
      # to avoid autoload race conditions in JRuby.
      initializer :preload_frameworks, :group => :all do
        ActiveSupport::Autoload.eager_autoload! if config.preload_frameworks
      end

      # Initialize the logger early in the stack in case we need to log some deprecation.
      initializer :initialize_logger, :group => :all do
        Rails.logger ||= config.logger || begin
          path = config.paths["log"].first
          unless File.exist? File.dirname path
            FileUtils.mkdir_p File.dirname path
          end

          f = File.open path, 'a'
          f.binmode
          f.sync = true # make sure every write flushes

          logger = ActiveSupport::TaggedLogging.new(
            ActiveSupport::BufferedLogger.new(f)
          )
          logger.level = ActiveSupport::BufferedLogger.const_get(config.log_level.to_s.upcase)
          logger
        rescue StandardError
          logger = ActiveSupport::TaggedLogging.new(ActiveSupport::BufferedLogger.new(STDERR))
          logger.level = ActiveSupport::BufferedLogger::WARN
          logger.warn(
            "Rails Error: Unable to access log file. Please ensure that #{path} exists and is chmod 0666. " +
            "The log level has been raised to WARN and the output directed to STDERR until the problem is fixed."
          )
          logger
        end
      end

      # Initialize cache early in the stack so railties can make use of it.
      initializer :initialize_cache, :group => :all do
        unless defined?(RAILS_CACHE)
          silence_warnings { Object.const_set "RAILS_CACHE", ActiveSupport::Cache.lookup_store(config.cache_store) }

          if RAILS_CACHE.respond_to?(:middleware)
            config.middleware.insert_before("Rack::Runtime", RAILS_CACHE.middleware)
          end
        end
      end

      # Sets the dependency loading mechanism.
      # TODO: Remove files from the $" and always use require.
      initializer :initialize_dependency_mechanism, :group => :all do
        ActiveSupport::Dependencies.mechanism = config.cache_classes ? :require : :load
      end

      initializer :bootstrap_hook, :group => :all do |app|
        ActiveSupport.run_load_hooks(:before_initialize, app)
      end
    end
  end
end
require 'active_support/core_ext/string/encoding'
require 'active_support/core_ext/kernel/reporting'
require 'active_support/file_update_checker'
require 'rails/engine/configuration'

module Rails
  class Application
    class Configuration < ::Rails::Engine::Configuration
      attr_accessor :allow_concurrency, :asset_host, :asset_path, :assets,
                    :cache_classes, :cache_store, :consider_all_requests_local,
                    :dependency_loading, :exceptions_app, :file_watcher, :filter_parameters,
                    :force_ssl, :helpers_paths, :logger, :log_tags, :preload_frameworks,
                    :railties_order, :relative_url_root, :reload_plugins, :secret_token,
                    :serve_static_assets, :ssl_options, :static_cache_control, :session_options,
                    :time_zone, :reload_classes_only_on_change, :whiny_nils

      attr_writer :log_level
      attr_reader :encoding

      def initialize(*)
        super
        self.encoding = "utf-8"
        @allow_concurrency             = false
        @consider_all_requests_local   = false
        @filter_parameters             = []
        @helpers_paths                 = []
        @dependency_loading            = true
        @serve_static_assets           = true
        @static_cache_control          = nil
        @force_ssl                     = false
        @ssl_options                   = {}
        @session_store                 = :cookie_store
        @session_options               = {}
        @time_zone                     = "UTC"
        @log_level                     = nil
        @middleware                    = app_middleware
        @generators                    = app_generators
        @cache_store                   = [ :file_store, "#{root}/tmp/cache/" ]
        @railties_order                = [:all]
        @relative_url_root             = ENV["RAILS_RELATIVE_URL_ROOT"]
        @reload_classes_only_on_change = true
        @file_watcher                  = ActiveSupport::FileUpdateChecker
        @exceptions_app                = nil

        @assets = ActiveSupport::OrderedOptions.new
        @assets.enabled                  = false
        @assets.paths                    = []
        @assets.precompile               = [ Proc.new{ |path| !File.extname(path).in?(['.js', '.css']) },
                                             /(?:\/|\\|\A)application\.(css|js)$/ ]
        @assets.prefix                   = "/assets"
        @assets.version                  = ''
        @assets.debug                    = false
        @assets.compile                  = true
        @assets.digest                   = false
        @assets.manifest                 = nil
        @assets.cache_store              = [ :file_store, "#{root}/tmp/cache/assets/" ]
        @assets.js_compressor            = nil
        @assets.css_compressor           = nil
        @assets.initialize_on_precompile = true
        @assets.logger                   = nil
      end

      def compiled_asset_path
        "/"
      end

      def encoding=(value)
        @encoding = value
        if "ruby".encoding_aware?
          silence_warnings do
            Encoding.default_external = value
            Encoding.default_internal = value
          end
        else
          $KCODE = value
          if $KCODE == "NONE"
            raise "The value you specified for config.encoding is " \
                  "invalid. The possible values are UTF8, SJIS, or EUC"
          end
        end
      end

      def paths
        @paths ||= begin
          paths = super
          paths.add "config/database",    :with => "config/database.yml"
          paths.add "config/environment", :with => "config/environment.rb"
          paths.add "lib/templates"
          paths.add "log",                :with => "log/#{Rails.env}.log"
          paths.add "public"
          paths.add "public/javascripts"
          paths.add "public/stylesheets"
          paths.add "tmp"
          paths
        end
      end

      # Enable threaded mode. Allows concurrent requests to controller actions and
      # multiple database connections. Also disables automatic dependency loading
      # after boot, and disables reloading code on every request, as these are
      # fundamentally incompatible with thread safety.
      def threadsafe!
        self.preload_frameworks = true
        self.cache_classes = true
        self.dependency_loading = false
        self.allow_concurrency = true
        self
      end

      # Loads and returns the contents of the #database_configuration_file. The
      # contents of the file are processed via ERB before being sent through
      # YAML::load.
      def database_configuration
        require 'erb'
        YAML::load(ERB.new(IO.read(paths["config/database"].first)).result)
      end

      def log_level
        @log_level ||= Rails.env.production? ? :info : :debug
      end

      def colorize_logging
        @colorize_logging
      end

      def colorize_logging=(val)
        @colorize_logging = val
        ActiveSupport::LogSubscriber.colorize_logging = val
        self.generators.colorize_logging = val
      end

      def session_store(*args)
        if args.empty?
          case @session_store
          when :disabled
            nil
          when :active_record_store
            ActiveRecord::SessionStore
          when Symbol
            ActionDispatch::Session.const_get(@session_store.to_s.camelize)
          else
            @session_store
          end
        else
          @session_store = args.shift
          @session_options = args.shift || {}
        end
      end
    end
  end
end
module Rails
  class Application
    module Finisher
      include Initializable

      initializer :add_generator_templates do
        config.generators.templates.unshift(*paths["lib/templates"].existent)
      end

      initializer :ensure_autoload_once_paths_as_subset do
        extra = ActiveSupport::Dependencies.autoload_once_paths -
                ActiveSupport::Dependencies.autoload_paths

        unless extra.empty?
          abort <<-end_error
            autoload_once_paths must be a subset of the autoload_paths.
            Extra items in autoload_once_paths: #{extra * ','}
          end_error
        end
      end

      initializer :add_builtin_route do |app|
        if Rails.env.development?
          app.routes.append do
            match '/rails/info/properties' => "rails/info#properties"
          end
        end
      end

      initializer :build_middleware_stack do
        build_middleware_stack
      end

      initializer :define_main_app_helper do |app|
        app.routes.define_mounted_helper(:main_app)
      end

      initializer :add_to_prepare_blocks do
        config.to_prepare_blocks.each do |block|
          ActionDispatch::Reloader.to_prepare(&block)
        end
      end

      # This needs to happen before eager load so it happens
      # in exactly the same point regardless of config.cache_classes
      initializer :run_prepare_callbacks do
        ActionDispatch::Reloader.prepare!
      end

      initializer :eager_load! do
        if config.cache_classes && !(defined?($rails_rake_task) && $rails_rake_task)
          ActiveSupport.run_load_hooks(:before_eager_load, self)
          eager_load!
        end
      end

      # All initialization is done, including eager loading in production
      initializer :finisher_hook do
        ActiveSupport.run_load_hooks(:after_initialize, self)
      end

      # Set app reload just after the finisher hook to ensure
      # routes added in the hook are still loaded.
      initializer :set_routes_reloader_hook do
        reloader = routes_reloader
        reloader.execute_if_updated
        self.reloaders << reloader
        ActionDispatch::Reloader.to_prepare { reloader.execute_if_updated }
      end

      # Set app reload just after the finisher hook to ensure
      # paths added in the hook are still loaded.
      initializer :set_clear_dependencies_hook, :group => :all do
        callback = lambda do
          ActiveSupport::DescendantsTracker.clear
          ActiveSupport::Dependencies.clear
        end

        if config.reload_classes_only_on_change
          reloader = config.file_watcher.new(*watchable_args, &callback)
          self.reloaders << reloader
          # We need to set a to_prepare callback regardless of the reloader result, i.e.
          # models should be reloaded if any of the reloaders (i18n, routes) were updated.
          ActionDispatch::Reloader.to_prepare(:prepend => true){ reloader.execute }
        else
          ActionDispatch::Reloader.to_cleanup(&callback)
        end
      end

      # Disable dependency loading during request cycle
      initializer :disable_dependency_loading do
        if config.cache_classes && !config.dependency_loading
          ActiveSupport::Dependencies.unhook!
        end
      end
    end
  end
end
require 'rails/engine/railties'

module Rails
  class Application < Engine
    class Railties < Rails::Engine::Railties
      def all(&block)
        @all ||= railties + engines + plugins
        @all.each(&block) if block
        @all
      end
    end
  end
end
module Rails
  class Application
    ##
    # This class is just used for displaying route information when someone
    # executes `rake routes`.  People should not use this class.
    class RouteInspector # :nodoc:
      def initialize
        @engines = ActiveSupport::OrderedHash.new
      end

      def format all_routes, filter = nil
        if filter
          all_routes = all_routes.select{ |route| route.defaults[:controller] == filter }
        end

        routes = collect_routes(all_routes)

        formatted_routes(routes) +
          formatted_routes_for_engines
      end

      def collect_routes(routes)
        routes = routes.collect do |route|
          route_reqs = route.requirements

          rack_app = discover_rack_app(route.app)

          controller = route_reqs[:controller] || ':controller'
          action     = route_reqs[:action]     || ':action'

          endpoint = rack_app ? rack_app.inspect : "#{controller}##{action}"
          constraints = route_reqs.except(:controller, :action)

          reqs = endpoint
          reqs += " #{constraints.inspect}" unless constraints.empty?

          verb = route.verb.source.gsub(/[$^]/, '')

          collect_engine_routes(reqs, rack_app)

          {:name => route.name.to_s, :verb => verb, :path => route.path.spec.to_s, :reqs => reqs }
        end

        # Skip the route if it's internal info route
        routes.reject { |r| r[:path] =~ %r{/rails/info/properties|^#{Rails.application.config.assets.prefix}} }
      end

      def collect_engine_routes(name, rack_app)
        return unless rack_app && rack_app.respond_to?(:routes)
        return if @engines[name]

        routes = rack_app.routes
        if routes.is_a?(ActionDispatch::Routing::RouteSet)
          @engines[name] = collect_routes(routes.routes)
        end
      end

      def formatted_routes_for_engines
        @engines.map do |name, routes|
          ["\nRoutes for #{name}:"] + formatted_routes(routes)
        end.flatten
      end

      def formatted_routes(routes)
        name_width = routes.map{ |r| r[:name].length }.max
        verb_width = routes.map{ |r| r[:verb].length }.max
        path_width = routes.map{ |r| r[:path].length }.max

        routes.map do |r|
          "#{r[:name].rjust(name_width)} #{r[:verb].ljust(verb_width)} #{r[:path].ljust(path_width)} #{r[:reqs]}"
        end
      end

      def discover_rack_app(app)
        class_name = app.class.name.to_s
        if class_name == "ActionDispatch::Routing::Mapper::Constraints"
          discover_rack_app(app.app)
        elsif class_name !~ /^ActionDispatch::Routing/
          app
        end
      end
    end
  end
end
require "active_support/core_ext/module/delegation"

module Rails
  class Application
    class RoutesReloader
      attr_reader :route_sets, :paths
      delegate :execute_if_updated, :execute, :updated?, :to => :updater

      def initialize
        @paths      = []
        @route_sets = []
      end

      def reload!
        clear!
        load_paths
        finalize!
      ensure
        revert
      end

    private

      def updater
        @updater ||= begin
          updater = ActiveSupport::FileUpdateChecker.new(paths) { reload! }
          updater.execute
          updater
        end
      end

      def clear!
        route_sets.each do |routes|
          routes.disable_clear_and_finalize = true
          routes.clear!
        end
      end

      def load_paths
        paths.each { |path| load(path) }
      end

      def finalize!
        route_sets.each do |routes|
          ActiveSupport.on_load(:action_controller) { routes.finalize! }
        end
      end

      def revert
        route_sets.each do |routes|
          routes.disable_clear_and_finalize = false
        end
      end
    end
  end
end
require 'active_support/core_ext/hash/reverse_merge'
require 'fileutils'
require 'rails/plugin'
require 'rails/engine'

module Rails
  # In Rails 3.0, a Rails::Application object was introduced which is nothing more than
  # an Engine but with the responsibility of coordinating the whole boot process.
  #
  # == Initialization
  #
  # Rails::Application is responsible for executing all railties, engines and plugin
  # initializers. It also executes some bootstrap initializers (check
  # Rails::Application::Bootstrap) and finishing initializers, after all the others
  # are executed (check Rails::Application::Finisher).
  #
  # == Configuration
  #
  # Besides providing the same configuration as Rails::Engine and Rails::Railtie,
  # the application object has several specific configurations, for example
  # "allow_concurrency", "cache_classes", "consider_all_requests_local", "filter_parameters",
  # "logger", "reload_plugins" and so forth.
  #
  # Check Rails::Application::Configuration to see them all.
  #
  # == Routes
  #
  # The application object is also responsible for holding the routes and reloading routes
  # whenever the files change in development.
  #
  # == Middlewares
  #
  # The Application is also responsible for building the middleware stack.
  #
  # == Booting process
  #
  # The application is also responsible for setting up and executing the booting
  # process. From the moment you require "config/application.rb" in your app,
  # the booting process goes like this:
  #
  #   1)  require "config/boot.rb" to setup load paths
  #   2)  require railties and engines
  #   3)  Define Rails.application as "class MyApp::Application < Rails::Application"
  #   4)  Run config.before_configuration callbacks
  #   5)  Load config/environments/ENV.rb
  #   6)  Run config.before_initialize callbacks
  #   7)  Run Railtie#initializer defined by railties, engines and application.
  #       One by one, each engine sets up its load paths, routes and runs its config/initializers/* files.
  #   9)  Custom Railtie#initializers added by railties, engines and applications are executed
  #   10) Build the middleware stack and run to_prepare callbacks
  #   11) Run config.before_eager_load and eager_load if cache classes is true
  #   12) Run config.after_initialize callbacks
  #
  class Application < Engine
    autoload :Bootstrap,      'rails/application/bootstrap'
    autoload :Configuration,  'rails/application/configuration'
    autoload :Finisher,       'rails/application/finisher'
    autoload :Railties,       'rails/application/railties'
    autoload :RoutesReloader, 'rails/application/routes_reloader'

    class << self
      def inherited(base)
        raise "You cannot have more than one Rails::Application" if Rails.application
        super
        Rails.application = base.instance
        Rails.application.add_lib_to_load_path!
        ActiveSupport.run_load_hooks(:before_configuration, base.instance)
      end
    end

    attr_accessor :assets, :sandbox
    alias_method :sandbox?, :sandbox
    attr_reader :reloaders

    delegate :default_url_options, :default_url_options=, :to => :routes

    def initialize
      super
      @initialized = false
      @reloaders   = []
    end

    # This method is called just after an application inherits from Rails::Application,
    # allowing the developer to load classes in lib and use them during application
    # configuration.
    #
    #   class MyApplication < Rails::Application
    #     require "my_backend" # in lib/my_backend
    #     config.i18n.backend = MyBackend
    #   end
    #
    # Notice this method takes into consideration the default root path. So if you
    # are changing config.root inside your application definition or having a custom
    # Rails application, you will need to add lib to $LOAD_PATH on your own in case
    # you need to load files in lib/ during the application configuration as well.
    def add_lib_to_load_path! #:nodoc:
      path = config.root.join('lib').to_s
      $LOAD_PATH.unshift(path) if File.exists?(path)
    end

    def require_environment! #:nodoc:
      environment = paths["config/environment"].existent.first
      require environment if environment
    end

    # Reload application routes regardless if they changed or not.
    def reload_routes!
      routes_reloader.reload!
    end

    def routes_reloader #:nodoc:
      @routes_reloader ||= RoutesReloader.new
    end

    # Returns an array of file paths appended with a hash of directories-extensions
    # suitable for ActiveSupport::FileUpdateChecker API.
    def watchable_args
      files = []
      files.concat config.watchable_files

      dirs = {}
      dirs.merge! config.watchable_dirs
      ActiveSupport::Dependencies.autoload_paths.each do |path|
        dirs[path.to_s] = [:rb]
      end

      [files, dirs]
    end

    # Initialize the application passing the given group. By default, the
    # group is :default but sprockets precompilation passes group equals
    # to assets if initialize_on_precompile is false to avoid booting the
    # whole app.
    def initialize!(group=:default) #:nodoc:
      raise "Application has been already initialized." if @initialized
      run_initializers(group, self)
      @initialized = true
      self
    end

    # Load the application and its railties tasks and invoke the registered hooks.
    # Check <tt>Rails::Railtie.rake_tasks</tt> for more info.
    def load_tasks(app=self)
      initialize_tasks
      super
      self
    end

    # Load the application console and invoke the registered hooks.
    # Check <tt>Rails::Railtie.console</tt> for more info.
    def load_console(app=self)
      initialize_console
      super
      self
    end

    # Rails.application.env_config stores some of the Rails initial environment parameters.
    # Currently stores:
    #
    #   * "action_dispatch.parameter_filter"         => config.filter_parameters,
    #   * "action_dispatch.secret_token"             => config.secret_token,
    #   * "action_dispatch.show_exceptions"          => config.action_dispatch.show_exceptions,
    #   * "action_dispatch.show_detailed_exceptions" => config.consider_all_requests_local,
    #   * "action_dispatch.logger"                   => Rails.logger,
    #   * "action_dispatch.backtrace_cleaner"        => Rails.backtrace_cleaner
    #
    # These parameters will be used by middlewares and engines to configure themselves.
    #
    def env_config
      @env_config ||= super.merge({
        "action_dispatch.parameter_filter" => config.filter_parameters,
        "action_dispatch.secret_token" => config.secret_token,
        "action_dispatch.show_exceptions" => config.action_dispatch.show_exceptions,
        "action_dispatch.show_detailed_exceptions" => config.consider_all_requests_local,
        "action_dispatch.logger" => Rails.logger,
        "action_dispatch.backtrace_cleaner" => Rails.backtrace_cleaner
      })
    end

    # Returns the ordered railties for this application considering railties_order.
    def ordered_railties #:nodoc:
      @ordered_railties ||= begin
        order = config.railties_order.map do |railtie|
          if railtie == :main_app
            self
          elsif railtie.respond_to?(:instance)
            railtie.instance
          else
            railtie
          end
        end

        all = (railties.all - order)
        all.push(self)   unless (all + order).include?(self)
        order.push(:all) unless order.include?(:all)

        index = order.index(:all)
        order[index] = all
        order.reverse.flatten
      end
    end

    def initializers #:nodoc:
      Bootstrap.initializers_for(self) +
      super +
      Finisher.initializers_for(self)
    end

    def config #:nodoc:
      @config ||= Application::Configuration.new(find_root_with_flag("config.ru", Dir.pwd))
    end

    def to_app
      self
    end

    def helpers_paths #:nodoc:
      config.helpers_paths
    end

    def call(env)
      env["ORIGINAL_FULLPATH"] = build_original_fullpath(env)
      super(env)
    end

  protected

    alias :build_middleware_stack :app

    def reload_dependencies?
      config.reload_classes_only_on_change != true || reloaders.map(&:updated?).any?
    end

    def default_middleware_stack
      require 'action_controller/railtie'

      ActionDispatch::MiddlewareStack.new.tap do |middleware|
        if rack_cache = config.action_controller.perform_caching && config.action_dispatch.rack_cache
          require "action_dispatch/http/rack_cache"
          middleware.use ::Rack::Cache, rack_cache
        end

        if config.force_ssl
          require "rack/ssl"
          middleware.use ::Rack::SSL, config.ssl_options
        end

        if config.serve_static_assets
          middleware.use ::ActionDispatch::Static, paths["public"].first, config.static_cache_control
        end

        middleware.use ::Rack::Lock unless config.allow_concurrency
        middleware.use ::Rack::Runtime
        middleware.use ::Rack::MethodOverride
        middleware.use ::ActionDispatch::RequestId
        middleware.use ::Rails::Rack::Logger, config.log_tags # must come after Rack::MethodOverride to properly log overridden methods
        middleware.use ::ActionDispatch::ShowExceptions, config.exceptions_app || ActionDispatch::PublicExceptions.new(Rails.public_path)
        middleware.use ::ActionDispatch::DebugExceptions
        middleware.use ::ActionDispatch::RemoteIp, config.action_dispatch.ip_spoofing_check, config.action_dispatch.trusted_proxies

        if config.action_dispatch.x_sendfile_header.present?
          middleware.use ::Rack::Sendfile, config.action_dispatch.x_sendfile_header
        end

        unless config.cache_classes
          app = self
          middleware.use ::ActionDispatch::Reloader, lambda { app.reload_dependencies? }
        end

        middleware.use ::ActionDispatch::Callbacks
        middleware.use ::ActionDispatch::Cookies

        if config.session_store
          if config.force_ssl && !config.session_options.key?(:secure)
            config.session_options[:secure] = true
          end
          middleware.use config.session_store, config.session_options
          middleware.use ::ActionDispatch::Flash
        end

        middleware.use ::ActionDispatch::ParamsParser
        middleware.use ::ActionDispatch::Head
        middleware.use ::Rack::ConditionalGet
        middleware.use ::Rack::ETag, "no-cache"

        if config.action_dispatch.best_standards_support
          middleware.use ::ActionDispatch::BestStandardsSupport, config.action_dispatch.best_standards_support
        end
      end
    end

    def initialize_tasks #:nodoc:
      self.class.rake_tasks do
        require "rails/tasks"
        task :environment do
          $rails_rake_task = true
          require_environment!
        end
      end
    end

    def initialize_console #:nodoc:
      require "pp"
      require "rails/console/app"
      require "rails/console/helpers"
    end

    def build_original_fullpath(env)
      path_info    = env["PATH_INFO"]
      query_string = env["QUERY_STRING"]
      script_name  = env["SCRIPT_NAME"]

      if query_string.present?
        "#{script_name}#{path_info}?#{query_string}"
      else
        "#{script_name}#{path_info}"
      end
    end
  end
end
require 'active_support/backtrace_cleaner'

module Rails
  class BacktraceCleaner < ActiveSupport::BacktraceCleaner
    APP_DIRS_PATTERN = /^\/?(app|config|lib|test)/
    RENDER_TEMPLATE_PATTERN = /:in `_render_template_\w*'/

    def initialize
      super
      add_filter   { |line| line.sub("#{Rails.root}/", '') }
      add_filter   { |line| line.sub(RENDER_TEMPLATE_PATTERN, '') }
      add_filter   { |line| line.sub('./', '/') } # for tests

      add_gem_filters
      add_silencer { |line| line !~ APP_DIRS_PATTERN }
    end

    private
      def add_gem_filters
        return unless defined?(Gem)

        gems_paths = (Gem.path + [Gem.default_dir]).uniq.map!{ |p| Regexp.escape(p) }
        return if gems_paths.empty?

        gems_regexp = %r{(#{gems_paths.join('|')})/gems/([^/]+)-([\w.]+)/(.*)}
        add_filter { |line| line.sub(gems_regexp, '\2 (\3) \4') }
      end
  end

  # For installing the BacktraceCleaner in the test/unit
  module BacktraceFilterForTestUnit #:nodoc:
    def self.included(klass)
      klass.send :alias_method_chain, :filter_backtrace, :cleaning
    end

    def filter_backtrace_with_cleaning(backtrace, prefix=nil)
      backtrace = filter_backtrace_without_cleaning(backtrace, prefix)
      backtrace = backtrace.first.split("\n") if backtrace.size == 1
      Rails.backtrace_cleaner.clean(backtrace)
    end
  end
end
require 'rbconfig'
require 'rails/script_rails_loader'

# If we are inside a Rails application this method performs an exec and thus
# the rest of this script is not run.
Rails::ScriptRailsLoader.exec_script_rails!

require 'rails/ruby_version_check'
Signal.trap("INT") { puts; exit(1) }

if ARGV.first == 'plugin'
  ARGV.shift
  require 'rails/commands/plugin_new'
else
  require 'rails/commands/application'
end
class CodeStatistics #:nodoc:

  TEST_TYPES = %w(Units Functionals Unit\ tests Functional\ tests Integration\ tests)

  def initialize(*pairs)
    @pairs      = pairs
    @statistics = calculate_statistics
    @total      = calculate_total if pairs.length > 1
  end

  def to_s
    print_header
    @pairs.each { |pair| print_line(pair.first, @statistics[pair.first]) }
    print_splitter

    if @total
      print_line("Total", @total)
      print_splitter
    end

    print_code_test_stats
  end

  private
    def calculate_statistics
      Hash[@pairs.map{|pair| [pair.first, calculate_directory_statistics(pair.last)]}]
    end

    def calculate_directory_statistics(directory, pattern = /.*\.rb$/)
      stats = { "lines" => 0, "codelines" => 0, "classes" => 0, "methods" => 0 }

      Dir.foreach(directory) do |file_name|
        if File.directory?(directory + "/" + file_name) and (/^\./ !~ file_name)
          newstats = calculate_directory_statistics(directory + "/" + file_name, pattern)
          stats.each { |k, v| stats[k] += newstats[k] }
        end

        next unless file_name =~ pattern

        f = File.open(directory + "/" + file_name)
        comment_started = false
        while line = f.gets
          stats["lines"]     += 1
          if(comment_started)
            if line =~ /^=end/
              comment_started = false
            end
            next
          else
            if line =~ /^=begin/
              comment_started = true
              next
            end
          end
          stats["classes"]   += 1 if line =~ /^\s*class\s+[_A-Z]/
          stats["methods"]   += 1 if line =~ /^\s*def\s+[_a-z]/
          stats["codelines"] += 1 unless line =~ /^\s*$/ || line =~ /^\s*#/
        end
      end

      stats
    end

    def calculate_total
      total = { "lines" => 0, "codelines" => 0, "classes" => 0, "methods" => 0 }
      @statistics.each_value { |pair| pair.each { |k, v| total[k] += v } }
      total
    end

    def calculate_code
      code_loc = 0
      @statistics.each { |k, v| code_loc += v['codelines'] unless TEST_TYPES.include? k }
      code_loc
    end

    def calculate_tests
      test_loc = 0
      @statistics.each { |k, v| test_loc += v['codelines'] if TEST_TYPES.include? k }
      test_loc
    end

    def print_header
      print_splitter
      puts "| Name                 | Lines |   LOC | Classes | Methods | M/C | LOC/M |"
      print_splitter
    end

    def print_splitter
      puts "+----------------------+-------+-------+---------+---------+-----+-------+"
    end

    def print_line(name, statistics)
      m_over_c   = (statistics["methods"] / statistics["classes"])   rescue m_over_c = 0
      loc_over_m = (statistics["codelines"] / statistics["methods"]) - 2 rescue loc_over_m = 0

      start = if TEST_TYPES.include? name
        "| #{name.ljust(20)} "
      else
        "| #{name.ljust(20)} "
      end

      puts start +
           "| #{statistics["lines"].to_s.rjust(5)} " +
           "| #{statistics["codelines"].to_s.rjust(5)} " +
           "| #{statistics["classes"].to_s.rjust(7)} " +
           "| #{statistics["methods"].to_s.rjust(7)} " +
           "| #{m_over_c.to_s.rjust(3)} " +
           "| #{loc_over_m.to_s.rjust(5)} |"
    end

    def print_code_test_stats
      code  = calculate_code
      tests = calculate_tests

      puts "  Code LOC: #{code}     Test LOC: #{tests}     Code to Test Ratio: 1:#{sprintf("%.1f", tests.to_f/code)}"
      puts ""
    end
end
require 'rails/version'

if ['--version', '-v'].include?(ARGV.first)
  puts "Rails #{Rails::VERSION::STRING}"
  exit(0)
end

if ARGV.first != "new"
  ARGV[0] = "--help"
else
  ARGV.shift
  railsrc = File.join(File.expand_path("~"), ".railsrc")
  if File.exist?(railsrc)
    extra_args_string = File.open(railsrc).read
    extra_args = extra_args_string.split(/\n+/).map {|l| l.split}.flatten
    puts "Using #{extra_args.join(" ")} from #{railsrc}"
    ARGV << extra_args
    ARGV.flatten!
  end
end

require 'rubygems' if ARGV.include?("--dev")
require 'rails/generators'
require 'rails/generators/rails/app/app_generator'

module Rails
  module Generators
    class AppGenerator
      # We want to exit on failure to be kind to other libraries
      # This is only when accessing via CLI
      def self.exit_on_failure?
        true
      end
    end
  end
end

Rails::Generators::AppGenerator.start
require 'optparse'
require 'rails/test_help'
require 'rails/performance_test_help'

ARGV.push('--benchmark') # HAX
require 'active_support/testing/performance'
ARGV.pop

def options
  options = {}
  defaults = ActiveSupport::Testing::Performance::DEFAULTS

  OptionParser.new do |opt|
    opt.banner = "Usage: rails benchmarker 'Ruby.code' 'Ruby.more_code' ... [OPTS]"
    opt.on('-r', '--runs N', Numeric, 'Number of runs.', "Default: #{defaults[:runs]}") { |r| options[:runs] = r }
    opt.on('-o', '--output PATH', String, 'Directory to use when writing the results.', "Default: #{defaults[:output]}") { |o| options[:output] = o }
    opt.on('-m', '--metrics a,b,c', Array, 'Metrics to use.', "Default: #{defaults[:metrics].join(",")}") { |m| options[:metrics] = m.map(&:to_sym) }
    opt.parse!(ARGV)
  end

  options
end

class BenchmarkerTest < ActionDispatch::PerformanceTest #:nodoc:
  self.profile_options = options

  ARGV.each do |expression|
    eval <<-RUBY
      def test_#{expression.parameterize('_')}
        #{expression}
      end
    RUBY
  end
end
require 'optparse'
require 'irb'
require 'irb/completion'

module Rails
  class Console
    def self.start(app)
      new(app).start
    end

    def initialize(app)
      @app = app
    end

    def start
      options = {}

      OptionParser.new do |opt|
        opt.banner = "Usage: console [environment] [options]"
        opt.on('-s', '--sandbox', 'Rollback database modifications on exit.') { |v| options[:sandbox] = v }
        opt.on("--debugger", 'Enable ruby-debugging for the console.') { |v| options[:debugger] = v }
        opt.on('--irb', "DEPRECATED: Invoke `/your/choice/of/ruby script/rails console` instead") { |v| abort '--irb option is no longer supported. Invoke `/your/choice/of/ruby script/rails console` instead' }
        opt.parse!(ARGV)
      end

      @app.sandbox = options[:sandbox]
      @app.load_console

      if options[:debugger]
        begin
          require 'ruby-debug'
          puts "=> Debugger enabled"
        rescue Exception
          puts "You need to install ruby-debug to run the console in debugging mode. With gems, use 'gem install ruby-debug'"
          exit
        end
      end

      if options[:sandbox]
        puts "Loading #{Rails.env} environment in sandbox (Rails #{Rails.version})"
        puts "Any modifications you make will be rolled back on exit"
      else
        puts "Loading #{Rails.env} environment (Rails #{Rails.version})"
      end

      IRB::ExtendCommandBundle.send :include, Rails::ConsoleMethods
      IRB.start
    end
  end
end

# Has to set the RAILS_ENV before config/application is required
if ARGV.first && !ARGV.first.index("-") && env = ARGV.shift # has to shift the env ARGV so IRB doesn't freak
  ENV['RAILS_ENV'] = %w(production development test).detect {|e| e =~ /^#{env}/} || env
end
require 'erb'

begin
  require 'psych'
rescue LoadError
end

require 'yaml'
require 'optparse'
require 'rbconfig'

module Rails
  class DBConsole
    def self.start(app)
      new(app).start
    end

    def initialize(app)
      @app = app
    end

    def start
      include_password = false
      options = {}
      OptionParser.new do |opt|
        opt.banner = "Usage: dbconsole [environment] [options]"
        opt.on("-p", "--include-password", "Automatically provide the password from database.yml") do |v|
          include_password = true
        end

        opt.on("--mode [MODE]", ['html', 'list', 'line', 'column'],
          "Automatically put the sqlite3 database in the specified mode (html, list, line, column).") do |mode|
            options['mode'] = mode
        end

        opt.on("--header") do |h|
          options['header'] = h
        end

        opt.parse!(ARGV)
        abort opt.to_s unless (0..1).include?(ARGV.size)
      end

      unless config = @app.config.database_configuration[Rails.env]
        abort "No database is configured for the environment '#{Rails.env}'"
      end


      def find_cmd(*commands)
        dirs_on_path = ENV['PATH'].to_s.split(File::PATH_SEPARATOR)
        commands += commands.map{|cmd| "#{cmd}.exe"} if RbConfig::CONFIG['host_os'] =~ /mswin|mingw/

        full_path_command = nil
        found = commands.detect do |cmd|
          dir = dirs_on_path.detect do |path|
            full_path_command = File.join(path, cmd)
            File.executable? full_path_command
          end
        end
        found ? full_path_command : abort("Couldn't find database client: #{commands.join(', ')}. Check your $PATH and try again.")
      end

      case config["adapter"]
      when /^mysql/
        args = {
          'host'      => '--host',
          'port'      => '--port',
          'socket'    => '--socket',
          'username'  => '--user',
          'encoding'  => '--default-character-set'
        }.map { |opt, arg| "#{arg}=#{config[opt]}" if config[opt] }.compact

        if config['password'] && include_password
          args << "--password=#{config['password']}"
        elsif config['password'] && !config['password'].to_s.empty?
          args << "-p"
        end

        args << config['database']

        exec(find_cmd('mysql', 'mysql5'), *args)

      when "postgresql", "postgres"
        ENV['PGUSER']     = config["username"] if config["username"]
        ENV['PGHOST']     = config["host"] if config["host"]
        ENV['PGPORT']     = config["port"].to_s if config["port"]
        ENV['PGPASSWORD'] = config["password"].to_s if config["password"] && include_password
        exec(find_cmd('psql'), config["database"])

      when "sqlite"
        exec(find_cmd('sqlite'), config["database"])

      when "sqlite3"
        args = []

        args << "-#{options['mode']}" if options['mode']
        args << "-header" if options['header']
        args << config['database']

        exec(find_cmd('sqlite3'), *args)

      when "oracle", "oracle_enhanced"
        logon = ""

        if config['username']
          logon = config['username']
          logon << "/#{config['password']}" if config['password'] && include_password
          logon << "@#{config['database']}" if config['database']
        end

        exec(find_cmd('sqlplus'), logon)

      else
        abort "Unknown command-line client for #{config['database']}. Submit a Rails patch to add support!"
      end
    end
  end
end

# Has to set the RAILS_ENV before config/application is required
if ARGV.first && !ARGV.first.index("-") && env = ARGV.first
  ENV['RAILS_ENV'] = %w(production development test).detect {|e| e =~ /^#{env}/} || env
end
require 'rails/generators'
require 'active_support/core_ext/object/inclusion'

if ARGV.first.in?([nil, "-h", "--help"])
  Rails::Generators.help 'destroy'
  exit
end

name = ARGV.shift
Rails::Generators.invoke name, ARGV, :behavior => :revoke, :destination_root => Rails.root
require 'rails/generators'
require 'active_support/core_ext/object/inclusion'

if ARGV.first.in?([nil, "-h", "--help"])
  Rails::Generators.help 'generate'
  exit
end

name = ARGV.shift

root = defined?(ENGINE_ROOT) ? ENGINE_ROOT : Rails.root
Rails::Generators.invoke name, ARGV, :behavior => :invoke, :destination_root => root
# Rails Plugin Manager.
#
# Installing plugins:
#
#   $ rails plugin install continuous_builder asset_timestamping
#
# Specifying revisions:
#
#   * Subversion revision is a single integer.
#
#   * Git revision format:
#     - full - 'refs/tags/1.8.0' or 'refs/heads/experimental'
#     - short: 'experimental' (equivalent to 'refs/heads/experimental')
#              'tag 1.8.0' (equivalent to 'refs/tags/1.8.0')
#
#
# This is Free Software, copyright 2005 by Ryan Tomayko (rtomayko@gmail.com)
# and is licensed MIT: (http://www.opensource.org/licenses/mit-license.php)

$verbose = false

require 'open-uri'
require 'fileutils'
require 'tempfile'

include FileUtils

class RailsEnvironment
  attr_reader :root

  def initialize(dir)
    @root = dir
  end

  def self.find(dir=nil)
    dir ||= pwd
    while dir.length > 1
      return new(dir) if File.exist?(File.join(dir, 'config', 'environment.rb'))
      dir = File.dirname(dir)
    end
  end

  def self.default
    @default ||= find
  end

  def self.default=(rails_env)
    @default = rails_env
  end

  def install(name_uri_or_plugin)
    if name_uri_or_plugin.is_a? String
      if name_uri_or_plugin =~ /:\/\//
        plugin = Plugin.new(name_uri_or_plugin)
      else
        plugin = Plugins[name_uri_or_plugin]
      end
    else
      plugin = name_uri_or_plugin
    end
    if plugin
      plugin.install
    else
      puts "Plugin not found: #{name_uri_or_plugin}"
    end
  end

  def use_svn?
    require 'active_support/core_ext/kernel'
    silence_stderr {`svn --version` rescue nil}
    !$?.nil? && $?.success?
  end

  def use_externals?
    use_svn? && File.directory?("#{root}/vendor/plugins/.svn")
  end

  def use_checkout?
    # this is a bit of a guess. we assume that if the rails environment
    # is under subversion then they probably want the plugin checked out
    # instead of exported. This can be overridden on the command line
    File.directory?("#{root}/.svn")
  end

  def best_install_method
    return :http unless use_svn?
    case
      when use_externals? then :externals
      when use_checkout? then :checkout
      else :export
    end
  end

  def externals
    return [] unless use_externals?
    ext = `svn propget svn:externals "#{root}/vendor/plugins"`
    lines = ext.respond_to?(:lines) ? ext.lines : ext
    lines.reject{ |line| line.strip == '' }.map do |line|
      line.strip.split(/\s+/, 2)
    end
  end

  def externals=(items)
    unless items.is_a? String
      items = items.map{|name,uri| "#{name.ljust(29)} #{uri.chomp('/')}"}.join("\n")
    end
    Tempfile.open("svn-set-prop") do |file|
      file.write(items)
      file.flush
      system("svn propset -q svn:externals -F \"#{file.path}\" \"#{root}/vendor/plugins\"")
    end
  end
end

class Plugin
  attr_reader :name, :uri

  def initialize(uri, name = nil)
    @uri = uri
    guess_name(uri)
  end

  def self.find(name)
    new(name)
  end

  def to_s
    "#{@name.ljust(30)}#{@uri}"
  end

  def svn_url?
    @uri =~ /svn(?:\+ssh)?:\/\/*/
  end

  def git_url?
    @uri =~ /^git:\/\// || @uri =~ /\.git$/
  end

  def installed?
    File.directory?("#{rails_env.root}/vendor/plugins/#{name}") \
      or rails_env.externals.detect{ |name, repo| self.uri == repo }
  end

  def install(method=nil, options = {})
    method ||= rails_env.best_install_method?
    if :http == method
      method = :export if svn_url?
      method = :git    if git_url?
    end

    uninstall if installed? and options[:force]

    unless installed?
      send("install_using_#{method}", options)
      run_install_hook
    else
      puts "already installed: #{name} (#{uri}).  pass --force to reinstall"
    end
  end

  def uninstall
    path = "#{rails_env.root}/vendor/plugins/#{name}"
    if File.directory?(path)
      puts "Removing 'vendor/plugins/#{name}'" if $verbose
      run_uninstall_hook
      rm_r path
    else
      puts "Plugin doesn't exist: #{path}"
    end

    if rails_env.use_externals?
      # clean up svn:externals
      externals = rails_env.externals
      externals.reject!{|n, u| name == n or name == u}
      rails_env.externals = externals
    end
  end

  def info
    tmp = "#{rails_env.root}/_tmp_about.yml"
    if svn_url?
      cmd = "svn export #{@uri} \"#{rails_env.root}/#{tmp}\""
      puts cmd if $verbose
      system(cmd)
    end
    open(svn_url? ? tmp : File.join(@uri, 'about.yml')) do |stream|
      stream.read
    end rescue "No about.yml found in #{uri}"
  ensure
    FileUtils.rm_rf tmp if svn_url?
  end

  private

    def run_install_hook
      install_hook_file = "#{rails_env.root}/vendor/plugins/#{name}/install.rb"
      load install_hook_file if File.exist? install_hook_file
    end

    def run_uninstall_hook
      uninstall_hook_file = "#{rails_env.root}/vendor/plugins/#{name}/uninstall.rb"
      load uninstall_hook_file if File.exist? uninstall_hook_file
    end

    def install_using_export(options = {})
      svn_command :export, options
    end

    def install_using_checkout(options = {})
      svn_command :checkout, options
    end

    def install_using_externals(options = {})
      externals = rails_env.externals
      externals.push([@name, uri])
      rails_env.externals = externals
      install_using_checkout(options)
    end

    def install_using_http(options = {})
      root = rails_env.root
      mkdir_p "#{root}/vendor/plugins/#{@name}"
      Dir.chdir "#{root}/vendor/plugins/#{@name}" do
        puts "fetching from '#{uri}'" if $verbose
        fetcher = RecursiveHTTPFetcher.new(uri, -1)
        fetcher.quiet = true if options[:quiet]
        fetcher.fetch
      end
    end

    def install_using_git(options = {})
      root = rails_env.root
      mkdir_p(install_path = "#{root}/vendor/plugins/#{name}")
      Dir.chdir install_path do
        init_cmd = "git init"
        init_cmd += " -q" if options[:quiet] and not $verbose
        puts init_cmd if $verbose
        system(init_cmd)
        base_cmd = "git pull --depth 1 #{uri}"
        base_cmd += " -q" if options[:quiet] and not $verbose
        base_cmd += " #{options[:revision]}" if options[:revision]
        puts base_cmd if $verbose
        if system(base_cmd)
          puts "removing: .git .gitignore" if $verbose
          rm_rf %w(.git .gitignore)
        else
          rm_rf install_path
        end
      end
    end

    def svn_command(cmd, options = {})
      root = rails_env.root
      mkdir_p "#{root}/vendor/plugins"
      base_cmd = "svn #{cmd} #{uri} \"#{root}/vendor/plugins/#{name}\""
      base_cmd += ' -q' if options[:quiet] and not $verbose
      base_cmd += " -r #{options[:revision]}" if options[:revision]
      puts base_cmd if $verbose
      system(base_cmd)
    end

    def guess_name(url)
      @name = File.basename(url)
      if @name == 'trunk' || @name.empty?
        @name = File.basename(File.dirname(url))
      end
      @name.gsub!(/\.git$/, '') if @name =~ /\.git$/
    end

    def rails_env
      @rails_env || RailsEnvironment.default
    end
end

# load default environment and parse arguments
require 'optparse'
module Rails
  module Commands
    class Plugin
      attr_reader :environment, :script_name
      def initialize
        @environment = RailsEnvironment.default
        @rails_root = RailsEnvironment.default.root
        @script_name = File.basename($0)
      end

      def environment=(value)
        @environment = value
        RailsEnvironment.default = value
      end

      def options
        OptionParser.new do |o|
          o.set_summary_indent('  ')
          o.banner =    "Usage: plugin [OPTIONS] command"
          o.define_head "Rails plugin manager."

          o.separator ""
          o.separator "GENERAL OPTIONS"

          o.on("-r", "--root=DIR", String,
               "Set an explicit rails app directory.",
               "Default: #{@rails_root}") { |rails_root| @rails_root = rails_root; self.environment = RailsEnvironment.new(@rails_root) }

          o.on("-v", "--verbose", "Turn on verbose output.") { |verbose| $verbose = verbose }
          o.on("-h", "--help", "Show this help message.") { puts o; exit }

          o.separator ""
          o.separator "COMMANDS"

          o.separator "  install    Install plugin(s) from known repositories or URLs."
          o.separator "  remove     Uninstall plugins."

          o.separator ""
          o.separator "EXAMPLES"
          o.separator "  Install a plugin from a subversion URL:"
          o.separator "    #{@script_name} plugin install http://example.com/my_svn_plugin\n"
          o.separator "  Install a plugin from a git URL:"
          o.separator "    #{@script_name} plugin install git://github.com/SomeGuy/my_awesome_plugin.git\n"
          o.separator "  Install a plugin and add a svn:externals entry to vendor/plugins"
          o.separator "    #{@script_name} plugin install -x my_svn_plugin\n"
        end
      end

      def parse!(args=ARGV)
        general, sub = split_args(args)
        options.parse!(general)

        command = general.shift
        if command =~ /^(install|remove)$/
          command = Commands.const_get(command.capitalize).new(self)
          command.parse!(sub)
        else
          puts "Unknown command: #{command}" unless command.blank?
          puts options
          exit 1
        end
      end

      def split_args(args)
        left = []
        left << args.shift while args[0] and args[0] =~ /^-/
        left << args.shift if args[0]
        [left, args]
      end

      def self.parse!(args=ARGV)
        Plugin.new.parse!(args)
      end
    end

    class Install
      def initialize(base_command)
        @base_command = base_command
        @method = :http
        @options = { :quiet => false, :revision => nil, :force => false }
      end

      def options
        OptionParser.new do |o|
          o.set_summary_indent('  ')
          o.banner =    "Usage: #{@base_command.script_name} install PLUGIN [PLUGIN [PLUGIN] ...]"
          o.define_head "Install one or more plugins."
          o.separator   ""
          o.separator   "Options:"
          o.on(         "-x", "--externals",
                        "Use svn:externals to grab the plugin.",
                        "Enables plugin updates and plugin versioning.") { |v| @method = :externals }
          o.on(         "-o", "--checkout",
                        "Use svn checkout to grab the plugin.",
                        "Enables updating but does not add a svn:externals entry.") { |v| @method = :checkout }
          o.on(         "-e", "--export",
                        "Use svn export to grab the plugin.",
                        "Exports the plugin, allowing you to check it into your local repository. Does not enable updates or add an svn:externals entry.") { |v| @method = :export }
          o.on(         "-q", "--quiet",
                        "Suppresses the output from installation.",
                        "Ignored if -v is passed (rails plugin -v install ...)") { |v| @options[:quiet] = true }
          o.on(         "-r REVISION", "--revision REVISION",
                        "Checks out the given revision from subversion or git.",
                        "Ignored if subversion/git is not used.") { |v| @options[:revision] = v }
          o.on(         "-f", "--force",
                        "Reinstalls a plugin if it's already installed.") { |v| @options[:force] = true }
          o.separator   ""
          o.separator   "You can specify plugin names as given in 'plugin list' output or absolute URLs to "
          o.separator   "a plugin repository."
        end
      end

      def determine_install_method
        best = @base_command.environment.best_install_method
        @method = :http if best == :http and @method == :export
        case
        when (best == :http and @method != :http)
          msg = "Cannot install using subversion because `svn' cannot be found in your PATH"
        when (best == :export and (@method != :export and @method != :http))
          msg = "Cannot install using #{@method} because this project is not under subversion."
        when (best != :externals and @method == :externals)
          msg = "Cannot install using externals because vendor/plugins is not under subversion."
        end
        if msg
          puts msg
          exit 1
        end
        @method
      end

      def parse!(args)
        options.parse!(args)
        if args.blank?
          puts options
          exit 1
        end
        environment = @base_command.environment
        install_method = determine_install_method
        puts "Plugins will be installed using #{install_method}" if $verbose
        args.each do |name|
          ::Plugin.find(name).install(install_method, @options)
        end
      rescue StandardError => e
        puts "Plugin not found: #{args.inspect}"
        puts e.inspect if $verbose
        exit 1
      end
    end

    class Remove
      def initialize(base_command)
        @base_command = base_command
      end

      def options
        OptionParser.new do |o|
          o.set_summary_indent('  ')
          o.banner =    "Usage: #{@base_command.script_name} remove name [name]..."
          o.define_head "Remove plugins."
        end
      end

      def parse!(args)
        options.parse!(args)
        if args.blank?
          puts options
          exit 1
        end
        root = @base_command.environment.root
        args.each do |name|
          ::Plugin.new(name).uninstall
        end
      end
    end

    class Info
      def initialize(base_command)
        @base_command = base_command
      end

      def options
        OptionParser.new do |o|
          o.set_summary_indent('  ')
          o.banner =    "Usage: #{@base_command.script_name} info name [name]..."
          o.define_head "Shows plugin info at {url}/about.yml."
        end
      end

      def parse!(args)
        options.parse!(args)
        args.each do |name|
          puts ::Plugin.find(name).info
          puts
        end
      end
    end
  end
end

class RecursiveHTTPFetcher
  attr_accessor :quiet
  def initialize(urls_to_fetch, level = 1, cwd = ".")
    @level = level
    @cwd = cwd
    @urls_to_fetch = RUBY_VERSION >= '1.9' ? urls_to_fetch.lines : urls_to_fetch.to_a
    @quiet = false
  end

  def ls
    @urls_to_fetch.collect do |url|
      if url =~ /^svn(\+ssh)?:\/\/.*/
        `svn ls #{url}`.split("\n").map {|entry| "/#{entry}"} rescue nil
      else
        open(url) do |stream|
          links("", stream.read)
        end rescue nil
      end
    end.flatten
  end

  def push_d(dir)
    @cwd = File.join(@cwd, dir)
    FileUtils.mkdir_p(@cwd)
  end

  def pop_d
    @cwd = File.dirname(@cwd)
  end

  def links(base_url, contents)
    links = []
    contents.scan(/href\s*=\s*\"*[^\">]*/i) do |link|
      link = link.sub(/href="/i, "")
      next if link =~ /svnindex.xsl$/
      next if link =~ /^(\w*:|)\/\// || link =~ /^\./
      links << File.join(base_url, link)
    end
    links
  end

  def download(link)
    puts "+ #{File.join(@cwd, File.basename(link))}" unless @quiet
    open(link) do |stream|
      File.open(File.join(@cwd, File.basename(link)), "wb") do |file|
        file.write(stream.read)
      end
    end
  end

  def fetch(links = @urls_to_fetch)
    links.each do |l|
      (l =~ /\/$/ || links == @urls_to_fetch) ? fetch_dir(l) : download(l)
    end
  end

  def fetch_dir(url)
    @level += 1
    push_d(File.basename(url)) if @level > 0
    open(url) do |stream|
      contents =  stream.read
      fetch(links(url, contents))
    end
    pop_d if @level > 0
    @level -= 1
  end
end

Rails::Commands::Plugin.parse!
require 'rubygems' if ARGV.include?("--dev")

if ARGV.first != "new"
  ARGV[0] = "--help"
else
  ARGV.shift
end

require 'rails/generators'
require 'rails/generators/rails/plugin_new/plugin_new_generator'
Rails::Generators::PluginNewGenerator.startrequire 'optparse'
require 'rails/test_help'
require 'rails/performance_test_help'
require 'active_support/testing/performance'

def options
  options = {}
  defaults = ActiveSupport::Testing::Performance::DEFAULTS

  OptionParser.new do |opt|
    opt.banner = "Usage: rails benchmarker 'Ruby.code' 'Ruby.more_code' ... [OPTS]"
    opt.on('-r', '--runs N', Numeric, 'Number of runs.', "Default: #{defaults[:runs]}") { |r| options[:runs] = r }
    opt.on('-o', '--output PATH', String, 'Directory to use when writing the results.', "Default: #{defaults[:output]}") { |o| options[:output] = o }
    opt.on('-m', '--metrics a,b,c', Array, 'Metrics to use.', "Default: #{defaults[:metrics].join(",")}") { |m| options[:metrics] = m.map(&:to_sym) }
    opt.on('-f', '--formats x,y,z', Array, 'Formats to output to.', "Default: #{defaults[:formats].join(",")}") { |m| options[:formats] = m.map(&:to_sym) }
    opt.parse!(ARGV)
  end

  options
end

class ProfilerTest < ActionDispatch::PerformanceTest #:nodoc:
  self.profile_options = options

  ARGV.each do |expression|
    eval <<-RUBY
      def test_#{expression.parameterize('_')}
        #{expression}
      end
    RUBY
  end
end
require 'optparse'
require 'rbconfig'

options = { :environment => (ENV['RAILS_ENV'] || "development").dup }
code_or_file = nil

if ARGV.first.nil?
  ARGV.push "-h"
end

ARGV.clone.options do |opts|
  script_name = File.basename($0)
  opts.banner = "Usage: runner [options] ('Some.ruby(code)' or a filename)"

  opts.separator ""

  opts.on("-e", "--environment=name", String,
          "Specifies the environment for the runner to operate under (test/development/production).",
          "Default: development") { |v| options[:environment] = v }

  opts.separator ""

  opts.on("-h", "--help",
          "Show this help message.") { $stdout.puts opts; exit }

  if RbConfig::CONFIG['host_os'] !~ /mswin|mingw/
    opts.separator ""
    opts.separator "You can also use runner as a shebang line for your scripts like this:"
    opts.separator "-------------------------------------------------------------"
    opts.separator "#!/usr/bin/env #{File.expand_path($0)} runner"
    opts.separator ""
    opts.separator "Product.all.each { |p| p.price *= 2 ; p.save! }"
    opts.separator "-------------------------------------------------------------"
  end

  opts.order! { |o| code_or_file ||= o } rescue retry
end

ARGV.delete(code_or_file)

ENV["RAILS_ENV"] = options[:environment]

require APP_PATH
Rails.application.require_environment!

if code_or_file.nil?
  $stderr.puts "Run '#{$0} -h' for help."
  exit 1
elsif File.exist?(code_or_file)
  $0 = code_or_file
  eval(File.read(code_or_file), nil, code_or_file)
else
  eval(code_or_file)
end
require 'fileutils'
require 'optparse'
require 'action_dispatch'

module Rails
  class Server < ::Rack::Server
    class Options
      def parse!(args)
        args, options = args.dup, {}

        opt_parser = OptionParser.new do |opts|
          opts.banner = "Usage: rails server [mongrel, thin, etc] [options]"
          opts.on("-p", "--port=port", Integer,
                  "Runs Rails on the specified port.", "Default: 3000") { |v| options[:Port] = v }
          opts.on("-b", "--binding=ip", String,
                  "Binds Rails to the specified ip.", "Default: 0.0.0.0") { |v| options[:Host] = v }
          opts.on("-c", "--config=file", String,
                  "Use custom rackup configuration file") { |v| options[:config] = v }
          opts.on("-d", "--daemon", "Make server run as a Daemon.") { options[:daemonize] = true }
          opts.on("-u", "--debugger", "Enable ruby-debugging for the server.") { options[:debugger] = true }
          opts.on("-e", "--environment=name", String,
                  "Specifies the environment to run this server under (test/development/production).",
                  "Default: development") { |v| options[:environment] = v }
          opts.on("-P","--pid=pid",String,
                  "Specifies the PID file.",
                  "Default: tmp/pids/server.pid") { |v| options[:pid] = v }

          opts.separator ""

          opts.on("-h", "--help", "Show this help message.") { puts opts; exit }
        end

        opt_parser.parse! args

        options[:server] = args.shift
        options
      end
    end

    def initialize(*)
      super
      set_environment
    end

    def app
      @app ||= super.respond_to?(:to_app) ? super.to_app : super
    end

    def opt_parser
      Options.new
    end

    def set_environment
      ENV["RAILS_ENV"] ||= options[:environment]
    end

    def start
      url = "#{options[:SSLEnable] ? 'https' : 'http'}://#{options[:Host]}:#{options[:Port]}"
      puts "=> Booting #{ActiveSupport::Inflector.demodulize(server)}"
      puts "=> Rails #{Rails.version} application starting in #{Rails.env} on #{url}"
      puts "=> Call with -d to detach" unless options[:daemonize]
      trap(:INT) { exit }
      puts "=> Ctrl-C to shutdown server" unless options[:daemonize]

      #Create required tmp directories if not found
      %w(cache pids sessions sockets).each do |dir_to_make|
        FileUtils.mkdir_p(Rails.root.join('tmp', dir_to_make))
      end

      super
    ensure
      # The '-h' option calls exit before @options is set.
      # If we call 'options' with it unset, we get double help banners.
      puts 'Exiting' unless @options && options[:daemonize]
    end

    def middleware
      middlewares = []
      middlewares << [Rails::Rack::LogTailer, log_path] unless options[:daemonize]
      middlewares << [Rails::Rack::Debugger]  if options[:debugger]
      middlewares << [::Rack::ContentLength]
      Hash.new(middlewares)
    end

    def log_path
      "log/#{options[:environment]}.log"
    end

    def default_options
      super.merge({
        :Port        => 3000,
        :environment => (ENV['RAILS_ENV'] || "development").dup,
        :daemonize   => false,
        :debugger    => false,
        :pid         => File.expand_path("tmp/pids/server.pid"),
        :config      => File.expand_path("config.ru")
      })
    end
  end
end
require File.expand_path(File.join(File.dirname(__FILE__), '..', 'generators'))

if ARGV.size == 0
  Rails::Generators.help
  exit
end

name = ARGV.shift
Rails::Generators.invoke name, ARGV, :behavior => :skip
require 'active_support/core_ext/object/inclusion'

ARGV << '--help' if ARGV.empty?

aliases = {
  "g"  => "generate",
  "d"  => "destroy",
  "c"  => "console",
  "s"  => "server",
  "db" => "dbconsole",
  "r"  => "runner"
}

command = ARGV.shift
command = aliases[command] || command

case command
when 'generate', 'destroy', 'plugin'
  require 'rails/generators'

  if command == 'plugin' && ARGV.first == 'new'
    require "rails/commands/plugin_new"
  else
    require APP_PATH
    Rails.application.require_environment!

    Rails.application.load_generators

    require "rails/commands/#{command}"
  end

when 'benchmarker', 'profiler'
  require APP_PATH
  Rails.application.require_environment!
  require "rails/commands/#{command}"

when 'console'
  require 'rails/commands/console'
  require APP_PATH
  Rails.application.require_environment!
  Rails::Console.start(Rails.application)

when 'server'
  # Change to the application's path if there is no config.ru file in current dir.
  # This allows us to run script/rails server from other directories, but still get
  # the main config.ru and properly set the tmp directory.
  Dir.chdir(File.expand_path('../../', APP_PATH)) unless File.exists?(File.expand_path("config.ru"))

  require 'rails/commands/server'
  Rails::Server.new.tap { |server|
    # We need to require application after the server sets environment,
    # otherwise the --environment option given to the server won't propagate.
    require APP_PATH
    Dir.chdir(Rails.application.root)
    server.start
  }

when 'dbconsole'
  require 'rails/commands/dbconsole'
  require APP_PATH
  Rails::DBConsole.start(Rails.application)

when 'application', 'runner'
  require "rails/commands/#{command}"

when 'new'
  if ARGV.first.in?(['-h', '--help'])
    require 'rails/commands/application'
  else
    puts "Can't initialize a new Rails application within the directory of another, please change to a non-Rails directory first.\n"
    puts "Type 'rails' for help."
    exit(1)
  end

when '--version', '-v'
  ARGV.unshift '--version'
  require 'rails/commands/application'

else
  puts "Error: Command not recognized" unless command.in?(['-h', '--help'])
  puts <<-EOT
Usage: rails COMMAND [ARGS]

The most common rails commands are:
 generate    Generate new code (short-cut alias: "g")
 console     Start the Rails console (short-cut alias: "c")
 server      Start the Rails server (short-cut alias: "s")
 dbconsole   Start a console for the database specified in config/database.yml
             (short-cut alias: "db")
 new         Create a new Rails application. "rails new my_app" creates a
             new application called MyApp in "./my_app"

In addition to those, there are:
 application  Generate the Rails application code
 destroy      Undo code generated with "generate" (short-cut alias: "d")
 benchmarker  See how fast a piece of code runs
 profiler     Get profile information from a piece of code
 plugin       Install a plugin
 runner       Run a piece of code in the application environment (short-cut alias: "r")

All commands can be run with -h (or --help) for more information.
  EOT
  exit(1)
end
require 'active_support/deprecation'
require 'active_support/ordered_options'
require 'active_support/core_ext/hash/deep_dup'
require 'rails/paths'
require 'rails/rack'

module Rails
  module Configuration
    class MiddlewareStackProxy #:nodoc:
      def initialize
        @operations = []
      end

      def insert_before(*args, &block)
        @operations << [:insert_before, args, block]
      end

      alias :insert :insert_before

      def insert_after(*args, &block)
        @operations << [:insert_after, args, block]
      end

      def swap(*args, &block)
        @operations << [:swap, args, block]
      end

      def use(*args, &block)
        @operations << [:use, args, block]
      end

      def delete(*args, &block)
        @operations << [:delete, args, block]
      end

      def merge_into(other)
        @operations.each do |operation, args, block|
          other.send(operation, *args, &block)
        end
        other
      end
    end

    class Generators #:nodoc:
      attr_accessor :aliases, :options, :templates, :fallbacks, :colorize_logging
      attr_reader :hidden_namespaces

      def initialize
        @aliases = Hash.new { |h,k| h[k] = {} }
        @options = Hash.new { |h,k| h[k] = {} }
        @fallbacks = {}
        @templates = []
        @colorize_logging = true
        @hidden_namespaces = []
      end

      def initialize_copy(source)
        @aliases = @aliases.deep_dup
        @options = @options.deep_dup
        @fallbacks = @fallbacks.deep_dup
        @templates = @templates.dup
      end

      def hide_namespace(namespace)
        @hidden_namespaces << namespace
      end

      def method_missing(method, *args)
        method = method.to_s.sub(/=$/, '').to_sym

        return @options[method] if args.empty?

        if method == :rails || args.first.is_a?(Hash)
          namespace, configuration = method, args.shift
        else
          namespace, configuration = args.shift, args.shift
          namespace = namespace.to_sym if namespace.respond_to?(:to_sym)
          @options[:rails][method] = namespace
        end

        if configuration
          aliases = configuration.delete(:aliases)
          @aliases[namespace].merge!(aliases) if aliases
          @options[namespace].merge!(configuration)
        end
      end
    end
  end
end
require 'active_support/all'
require 'active_support/test_case'
require 'action_controller'

# work around the at_exit hook in test/unit, which kills IRB
Test::Unit.run = true if Test::Unit.respond_to?(:run=)

module Rails
  module ConsoleMethods
    # reference the global "app" instance, created on demand. To recreate the
    # instance, pass a non-false value as the parameter.
    def app(create=false)
      @app_integration_instance = nil if create
      @app_integration_instance ||= new_session do |sess|
        sess.host! "www.example.com"
      end
    end

    # create a new session. If a block is given, the new session will be yielded
    # to the block before being returned.
    def new_session
      app = Rails.application
      session = ActionDispatch::Integration::Session.new(app)
      yield session if block_given?
      session
    end

    # reloads the environment
    def reload!(print=true)
      puts "Reloading..." if print
      ActionDispatch::Reloader.cleanup!
      ActionDispatch::Reloader.prepare!
      true
    end
  end
end
module Rails
  module ConsoleMethods
    def helper
      @helper ||= ApplicationController.helpers
    end

    def controller
      @controller ||= ApplicationController.new
    end
  end
end
require 'active_support/core_ext/object/inclusion'

ARGV << '--help' if ARGV.empty?

aliases = {
  "g" => "generate",
  "d" => "destroy"
}

command = ARGV.shift
command = aliases[command] || command

require ENGINE_PATH
engine = ::Rails::Engine.find(ENGINE_ROOT)

case command
when 'generate', 'destroy'
  require 'rails/generators'
  Rails::Generators.namespace = engine.railtie_namespace
  engine.load_generators
  require "rails/commands/#{command}"

when '--version', '-v'
  ARGV.unshift '--version'
  require 'rails/commands/application'

else
  puts "Error: Command not recognized" unless command.in?(['-h', '--help'])
  puts <<-EOT
Usage: rails COMMAND [ARGS]

The common rails commands available for engines are:
 generate    Generate new code (short-cut alias: "g")
 destroy     Undo code generated with "generate" (short-cut alias: "d")

All commands can be run with -h for more information.

If you want to run any commands that need to be run in context
of the application, like `rails server` or `rails console`,
you should do it from application's directory (typically test/dummy).
  EOT
  exit(1)
end
require 'rails/railtie/configuration'

module Rails
  class Engine
    class Configuration < ::Rails::Railtie::Configuration
      attr_reader :root
      attr_writer :middleware, :eager_load_paths, :autoload_once_paths, :autoload_paths
      attr_accessor :plugins

      def initialize(root=nil)
        super()
        @root = root
        @generators = app_generators.dup
      end

      # Returns the middleware stack for the engine.
      def middleware
        @middleware ||= Rails::Configuration::MiddlewareStackProxy.new
      end

      # Holds generators configuration:
      #
      #   config.generators do |g|
      #     g.orm             :datamapper, :migration => true
      #     g.template_engine :haml
      #     g.test_framework  :rspec
      #   end
      #
      # If you want to disable color in console, do:
      #
      #   config.generators.colorize_logging = false
      #
      def generators #:nodoc:
        @generators ||= Rails::Configuration::Generators.new
        yield(@generators) if block_given?
        @generators
      end

      def paths
        @paths ||= begin
          paths = Rails::Paths::Root.new(@root)
          paths.add "app",                 :eager_load => true, :glob => "*"
          paths.add "app/assets",          :glob => "*"
          paths.add "app/controllers",     :eager_load => true
          paths.add "app/helpers",         :eager_load => true
          paths.add "app/models",          :eager_load => true
          paths.add "app/mailers",         :eager_load => true
          paths.add "app/views"
          paths.add "lib",                 :load_path => true
          paths.add "lib/assets",          :glob => "*"
          paths.add "lib/tasks",           :glob => "**/*.rake"
          paths.add "config"
          paths.add "config/environments", :glob => "#{Rails.env}.rb"
          paths.add "config/initializers", :glob => "**/*.rb"
          paths.add "config/locales",      :glob => "*.{rb,yml}"
          paths.add "config/routes",       :with => "config/routes.rb"
          paths.add "db"
          paths.add "db/migrate"
          paths.add "db/seeds",            :with => "db/seeds.rb"
          paths.add "vendor",              :load_path => true
          paths.add "vendor/assets",       :glob => "*"
          paths.add "vendor/plugins"
          paths
        end
      end

      def root=(value)
        @root = paths.path = Pathname.new(value).expand_path
      end

      def eager_load_paths
        @eager_load_paths ||= paths.eager_load
      end

      def autoload_once_paths
        @autoload_once_paths ||= paths.autoload_once
      end

      def autoload_paths
        @autoload_paths ||= paths.autoload_paths
      end
    end
  end
end
module Rails
  class Engine < Railtie
    class Railties
      # TODO Write tests for this behavior extracted from Application
      def initialize(config)
        @config = config
      end

      def all(&block)
        @all ||= plugins
        @all.each(&block) if block
        @all
      end

      def plugins
        @plugins ||= begin
          plugin_names = (@config.plugins || [:all]).map { |p| p.to_sym }
          Plugin.all(plugin_names, @config.paths["vendor/plugins"].existent)
        end
      end

      def self.railties
        @railties ||= ::Rails::Railtie.subclasses.map(&:instance)
      end

      def self.engines
        @engines ||= ::Rails::Engine.subclasses.map(&:instance)
      end

      delegate :railties, :engines, :to => "self.class"
    end
  end
end
require 'rails/railtie'
require 'active_support/core_ext/module/delegation'
require 'pathname'
require 'rbconfig'
require 'rails/engine/railties'

module Rails
  # <tt>Rails::Engine</tt> allows you to wrap a specific Rails application or subset of
  # functionality and share it with other applications. Since Rails 3.0, every
  # <tt>Rails::Application</tt> is just an engine, which allows for simple
  # feature and application sharing.
  #
  # Any <tt>Rails::Engine</tt> is also a <tt>Rails::Railtie</tt>, so the same
  # methods (like <tt>rake_tasks</tt> and +generators+) and configuration
  # options that are available in railties can also be used in engines.
  #
  # == Creating an Engine
  #
  # In Rails versions prior to 3.0, your gems automatically behaved as engines, however,
  # this coupled Rails to Rubygems. Since Rails 3.0, if you want a gem to automatically
  # behave as an engine, you have to specify an +Engine+ for it somewhere inside
  # your plugin's +lib+ folder (similar to how we specify a +Railtie+):
  #
  #   # lib/my_engine.rb
  #   module MyEngine
  #     class Engine < Rails::Engine
  #     end
  #   end
  #
  # Then ensure that this file is loaded at the top of your <tt>config/application.rb</tt>
  # (or in your +Gemfile+) and it will automatically load models, controllers and helpers
  # inside +app+, load routes at <tt>config/routes.rb</tt>, load locales at
  # <tt>config/locales/*</tt>, and load tasks at <tt>lib/tasks/*</tt>.
  #
  # == Configuration
  #
  # Besides the +Railtie+ configuration which is shared across the application, in a
  # <tt>Rails::Engine</tt> you can access <tt>autoload_paths</tt>, <tt>eager_load_paths</tt>
  # and <tt>autoload_once_paths</tt>, which, differently from a <tt>Railtie</tt>, are scoped to
  # the current engine.
  #
  # Example:
  #
  #   class MyEngine < Rails::Engine
  #     # Add a load path for this specific Engine
  #     config.autoload_paths << File.expand_path("../lib/some/path", __FILE__)
  #
  #     initializer "my_engine.add_middleware" do |app|
  #       app.middleware.use MyEngine::Middleware
  #     end
  #   end
  #
  # == Generators
  #
  # You can set up generators for engines with <tt>config.generators</tt> method:
  #
  #   class MyEngine < Rails::Engine
  #     config.generators do |g|
  #       g.orm             :active_record
  #       g.template_engine :erb
  #       g.test_framework  :test_unit
  #     end
  #   end
  #
  # You can also set generators for an application by using <tt>config.app_generators</tt>:
  #
  #   class MyEngine < Rails::Engine
  #     # note that you can also pass block to app_generators in the same way you
  #     # can pass it to generators method
  #     config.app_generators.orm :datamapper
  #   end
  #
  # == Paths
  #
  # Since Rails 3.0, applications and engines have more flexible path configuration (as
  # opposed to the previous hardcoded path configuration). This means that you are not
  # required to place your controllers at <tt>app/controllers</tt>, but in any place
  # which you find convenient.
  #
  # For example, let's suppose you want to place your controllers in <tt>lib/controllers</tt>.
  # You can set that as an option:
  #
  #   class MyEngine < Rails::Engine
  #     paths["app/controllers"] = "lib/controllers"
  #   end
  #
  # You can also have your controllers loaded from both <tt>app/controllers</tt> and
  # <tt>lib/controllers</tt>:
  #
  #   class MyEngine < Rails::Engine
  #     paths["app/controllers"] << "lib/controllers"
  #   end
  #
  # The available paths in an engine are:
  #
  #   class MyEngine < Rails::Engine
  #     paths["app"]                 # => ["app"]
  #     paths["app/controllers"]     # => ["app/controllers"]
  #     paths["app/helpers"]         # => ["app/helpers"]
  #     paths["app/models"]          # => ["app/models"]
  #     paths["app/views"]           # => ["app/views"]
  #     paths["lib"]                 # => ["lib"]
  #     paths["lib/tasks"]           # => ["lib/tasks"]
  #     paths["config"]              # => ["config"]
  #     paths["config/initializers"] # => ["config/initializers"]
  #     paths["config/locales"]      # => ["config/locales"]
  #     paths["config/routes"]       # => ["config/routes.rb"]
  #   end
  #
  # The <tt>Application</tt> class adds a couple more paths to this set. And as in your
  # <tt>Application</tt>, all folders under +app+ are automatically added to the load path.
  # If you have an <tt>app/observers</tt> folder for example, it will be added by default.
  #
  # == Endpoint
  #
  # An engine can be also a rack application. It can be useful if you have a rack application that
  # you would like to wrap with +Engine+ and provide some of the +Engine+'s features.
  #
  # To do that, use the +endpoint+ method:
  #
  #   module MyEngine
  #     class Engine < Rails::Engine
  #       endpoint MyRackApplication
  #     end
  #   end
  #
  # Now you can mount your engine in application's routes just like that:
  #
  #   MyRailsApp::Application.routes.draw do
  #     mount MyEngine::Engine => "/engine"
  #   end
  #
  # == Middleware stack
  #
  # As an engine can now be a rack endpoint, it can also have a middleware
  # stack. The usage is exactly the same as in <tt>Application</tt>:
  #
  #   module MyEngine
  #     class Engine < Rails::Engine
  #       middleware.use SomeMiddleware
  #     end
  #   end
  #
  # == Routes
  #
  # If you don't specify an endpoint, routes will be used as the default
  # endpoint. You can use them just like you use an application's routes:
  #
  #   # ENGINE/config/routes.rb
  #   MyEngine::Engine.routes.draw do
  #     match "/" => "posts#index"
  #   end
  #
  # == Mount priority
  #
  # Note that now there can be more than one router in your application, and it's better to avoid
  # passing requests through many routers. Consider this situation:
  #
  #   MyRailsApp::Application.routes.draw do
  #     mount MyEngine::Engine => "/blog"
  #     match "/blog/omg" => "main#omg"
  #   end
  #
  # +MyEngine+ is mounted at <tt>/blog</tt>, and <tt>/blog/omg</tt> points to application's
  # controller. In such a situation, requests to <tt>/blog/omg</tt> will go through +MyEngine+,
  # and if there is no such route in +Engine+'s routes, it will be dispatched to <tt>main#omg</tt>.
  # It's much better to swap that:
  #
  #   MyRailsApp::Application.routes.draw do
  #     match "/blog/omg" => "main#omg"
  #     mount MyEngine::Engine => "/blog"
  #   end
  #
  # Now, +Engine+ will get only requests that were not handled by +Application+.
  #
  # == Engine name
  #
  # There are some places where an Engine's name is used:
  #
  # * routes: when you mount an Engine with <tt>mount(MyEngine::Engine => '/my_engine')</tt>,
  #   it's used as default :as option
  # * some of the rake tasks are based on engine name, e.g. <tt>my_engine:install:migrations</tt>,
  #   <tt>my_engine:install:assets</tt>
  #
  # Engine name is set by default based on class name. For <tt>MyEngine::Engine</tt> it will be
  # <tt>my_engine_engine</tt>. You can change it manually using the <tt>engine_name</tt> method:
  #
  #   module MyEngine
  #     class Engine < Rails::Engine
  #       engine_name "my_engine"
  #     end
  #   end
  #
  # == Isolated Engine
  #
  # Normally when you create controllers, helpers and models inside an engine, they are treated
  # as if they were created inside the application itself. This means that all helpers and
  # named routes from the application will be available to your engine's controllers as well.
  #
  # However, sometimes you want to isolate your engine from the application, especially if your engine
  # has its own router. To do that, you simply need to call +isolate_namespace+. This method requires
  # you to pass a module where all your controllers, helpers and models should be nested to:
  #
  #   module MyEngine
  #     class Engine < Rails::Engine
  #       isolate_namespace MyEngine
  #     end
  #   end
  #
  # With such an engine, everything that is inside the +MyEngine+ module will be isolated from
  # the application.
  #
  # Consider such controller:
  #
  #   module MyEngine
  #     class FooController < ActionController::Base
  #     end
  #   end
  #
  # If an engine is marked as isolated, +FooController+ has access only to helpers from +Engine+ and
  # <tt>url_helpers</tt> from <tt>MyEngine::Engine.routes</tt>.
  #
  # The next thing that changes in isolated engines is the behavior of routes. Normally, when you namespace
  # your controllers, you also need to do namespace all your routes. With an isolated engine,
  # the namespace is applied by default, so you can ignore it in routes:
  #
  #   MyEngine::Engine.routes.draw do
  #     resources :articles
  #   end
  #
  # The routes above will automatically point to <tt>MyEngine::ApplicationController</tt>. Furthermore, you don't
  # need to use longer url helpers like <tt>my_engine_articles_path</tt>. Instead, you should simply use
  # <tt>articles_path</tt> as you would do with your application.
  #
  # To make that behavior consistent with other parts of the framework, an isolated engine also has influence on
  # <tt>ActiveModel::Naming</tt>. When you use a namespaced model, like <tt>MyEngine::Article</tt>, it will normally
  # use the prefix "my_engine". In an isolated engine, the prefix will be omitted in url helpers and
  # form fields for convenience.
  #
  #   polymorphic_url(MyEngine::Article.new) # => "articles_path"
  #
  #   form_for(MyEngine::Article.new) do
  #     text_field :title # => <input type="text" name="article[title]" id="article_title" />
  #   end
  #
  # Additionally, an isolated engine will set its name according to namespace, so
  # MyEngine::Engine.engine_name will be "my_engine". It will also set MyEngine.table_name_prefix
  # to "my_engine_", changing the MyEngine::Article model to use the my_engine_articles table.
  #
  # == Using Engine's routes outside Engine
  #
  # Since you can now mount an engine inside application's routes, you do not have direct access to +Engine+'s
  # <tt>url_helpers</tt> inside +Application+. When you mount an engine in an application's routes, a special helper is
  # created to allow you to do that. Consider such a scenario:
  #
  #   # config/routes.rb
  #   MyApplication::Application.routes.draw do
  #     mount MyEngine::Engine => "/my_engine", :as => "my_engine"
  #     match "/foo" => "foo#index"
  #   end
  #
  # Now, you can use the <tt>my_engine</tt> helper inside your application:
  #
  #   class FooController < ApplicationController
  #     def index
  #       my_engine.root_url #=> /my_engine/
  #     end
  #   end
  #
  # There is also a <tt>main_app</tt> helper that gives you access to application's routes inside Engine:
  #
  #   module MyEngine
  #     class BarController
  #       def index
  #         main_app.foo_path #=> /foo
  #       end
  #     end
  #   end
  #
  # Note that the <tt>:as</tt> option given to mount takes the <tt>engine_name</tt> as default, so most of the time
  # you can simply omit it.
  #
  # Finally, if you want to generate a url to an engine's route using
  # <tt>polymorphic_url</tt>, you also need to pass the engine helper. Let's
  # say that you want to create a form pointing to one of the engine's routes.
  # All you need to do is pass the helper as the first element in array with
  # attributes for url:
  #
  #   form_for([my_engine, @user])
  #
  # This code will use <tt>my_engine.user_path(@user)</tt> to generate the proper route.
  #
  # == Isolated engine's helpers
  #
  # Sometimes you may want to isolate engine, but use helpers that are defined for it.
  # If you want to share just a few specific helpers you can add them to application's
  # helpers in ApplicationController:
  #
  #   class ApplicationController < ActionController::Base
  #     helper MyEngine::SharedEngineHelper
  #   end
  #
  # If you want to include all of the engine's helpers, you can use #helpers method on an engine's
  # instance:
  #
  #   class ApplicationController < ActionController::Base
  #     helper MyEngine::Engine.helpers
  #   end
  #
  # It will include all of the helpers from engine's directory. Take into account that this does
  # not include helpers defined in controllers with helper_method or other similar solutions,
  # only helpers defined in the helpers directory will be included.
  #
  # == Migrations & seed data
  #
  # Engines can have their own migrations. The default path for migrations is exactly the same
  # as in application: <tt>db/migrate</tt>
  #
  # To use engine's migrations in application you can use rake task, which copies them to
  # application's dir:
  #
  #   rake ENGINE_NAME:install:migrations
  #
  # Note that some of the migrations may be skipped if a migration with the same name already exists
  # in application. In such a situation you must decide whether to leave that migration or rename the
  # migration in the application and rerun copying migrations.
  #
  # If your engine has migrations, you may also want to prepare data for the database in
  # the <tt>seeds.rb</tt> file. You can load that data using the <tt>load_seed</tt> method, e.g.
  #
  #   MyEngine::Engine.load_seed
  #
  # == Loading priority
  #
  # In order to change engine's priority you can use config.railties_order in main application.
  # It will affect the priority of loading views, helpers, assets and all the other files
  # related to engine or application.
  #
  # Example:
  #
  #   # load Blog::Engine with highest priority, followed by application and other railties
  #   config.railties_order = [Blog::Engine, :main_app, :all]
  #
  class Engine < Railtie
    autoload :Configuration, "rails/engine/configuration"
    autoload :Railties,      "rails/engine/railties"

    def load_generators(app=self)
      initialize_generators
      railties.all { |r| r.load_generators(app) }
      Rails::Generators.configure!(app.config.generators)
      super
      self
    end

    class << self
      attr_accessor :called_from, :isolated
      alias :isolated? :isolated
      alias :engine_name :railtie_name

      def inherited(base)
        unless base.abstract_railtie?
          base.called_from = begin
            # Remove the line number from backtraces making sure we don't leave anything behind
            call_stack = caller.map { |p| p.sub(/:\d+.*/, '') }
            File.dirname(call_stack.detect { |p| p !~ %r[railties[\w.-]*/lib/rails|rack[\w.-]*/lib/rack] })
          end
        end

        super
      end

      def endpoint(endpoint = nil)
        @endpoint ||= nil
        @endpoint = endpoint if endpoint
        @endpoint
      end

      def isolate_namespace(mod)
        engine_name(generate_railtie_name(mod))

        self.routes.default_scope = { :module => ActiveSupport::Inflector.underscore(mod.name) }
        self.isolated = true

        unless mod.respond_to?(:railtie_namespace)
          name, railtie = engine_name, self

          mod.singleton_class.instance_eval do
            define_method(:railtie_namespace) { railtie }

            unless mod.respond_to?(:table_name_prefix)
              define_method(:table_name_prefix) { "#{name}_" }
            end

            unless mod.respond_to?(:use_relative_model_naming?)
              class_eval "def use_relative_model_naming?; true; end", __FILE__, __LINE__
            end

            unless mod.respond_to?(:railtie_helpers_paths)
              define_method(:railtie_helpers_paths) { railtie.helpers_paths }
            end

            unless mod.respond_to?(:railtie_routes_url_helpers)
              define_method(:railtie_routes_url_helpers) { railtie.routes_url_helpers }
            end
          end
        end
      end

      # Finds engine with given path
      def find(path)
        expanded_path = File.expand_path path.to_s
        Rails::Engine::Railties.engines.find { |engine|
          File.expand_path(engine.root.to_s) == expanded_path
        }
      end
    end

    delegate :middleware, :root, :paths, :to => :config
    delegate :engine_name, :isolated?, :to => "self.class"

    def load_tasks(app=self)
      railties.all { |r| r.load_tasks(app) }
      super
      paths["lib/tasks"].existent.sort.each { |ext| load(ext) }
    end

    def load_console(app=self)
      railties.all { |r| r.load_console(app) }
      super
    end

    def eager_load!
      railties.all(&:eager_load!)

      config.eager_load_paths.each do |load_path|
        matcher = /\A#{Regexp.escape(load_path)}\/(.*)\.rb\Z/
        Dir.glob("#{load_path}/**/*.rb").sort.each do |file|
          require_dependency file.sub(matcher, '\1')
        end
      end
    end

    def railties
      @railties ||= self.class::Railties.new(config)
    end

    def helpers
      @helpers ||= begin
        helpers = Module.new
        all = ActionController::Base.all_helpers_from_path(helpers_paths)
        ActionController::Base.modules_for_helpers(all).each do |mod|
          helpers.send(:include, mod)
        end
        helpers
      end
    end

    def helpers_paths
      paths["app/helpers"].existent
    end

    def routes_url_helpers
      routes.url_helpers
    end

    def app
      @app ||= begin
        config.middleware = config.middleware.merge_into(default_middleware_stack)
        config.middleware.build(endpoint)
      end
    end

    def endpoint
      self.class.endpoint || routes
    end

    def call(env)
      app.call(env.merge!(env_config))
    end

    def env_config
      @env_config ||= {
        'action_dispatch.routes' => routes
      }
    end

    def routes
      @routes ||= ActionDispatch::Routing::RouteSet.new
      @routes.append(&Proc.new) if block_given?
      @routes
    end

    def ordered_railties
      railties.all + [self]
    end

    def initializers
      initializers = []
      ordered_railties.each do |r|
        if r == self
          initializers += super
        else
          initializers += r.initializers
        end
      end
      initializers
    end

    def config
      @config ||= Engine::Configuration.new(find_root_with_flag("lib"))
    end

    # Load data from db/seeds.rb file. It can be used in to load engines'
    # seeds, e.g.:
    #
    # Blog::Engine.load_seed
    def load_seed
      seed_file = paths["db/seeds"].existent.first
      load(seed_file) if seed_file
    end

    # Add configured load paths to ruby load paths and remove duplicates.
    initializer :set_load_path, :before => :bootstrap_hook do
      _all_load_paths.reverse_each do |path|
        $LOAD_PATH.unshift(path) if File.directory?(path)
      end
      $LOAD_PATH.uniq!
    end

    # Set the paths from which Rails will automatically load source files,
    # and the load_once paths.
    #
    # This needs to be an initializer, since it needs to run once
    # per engine and get the engine as a block parameter
    initializer :set_autoload_paths, :before => :bootstrap_hook do |app|
      ActiveSupport::Dependencies.autoload_paths.unshift(*_all_autoload_paths)
      ActiveSupport::Dependencies.autoload_once_paths.unshift(*_all_autoload_once_paths)

      # Freeze so future modifications will fail rather than do nothing mysteriously
      config.autoload_paths.freeze
      config.eager_load_paths.freeze
      config.autoload_once_paths.freeze
    end

    initializer :add_routing_paths do |app|
      paths = self.paths["config/routes"].existent

      if routes? || paths.any?
        app.routes_reloader.paths.unshift(*paths)
        app.routes_reloader.route_sets << routes
      end
    end

    # I18n load paths are a special case since the ones added
    # later have higher priority.
    initializer :add_locales do
      config.i18n.railties_load_path.concat(paths["config/locales"].existent)
    end

    initializer :add_view_paths do
      views = paths["app/views"].existent
      unless views.empty?
        ActiveSupport.on_load(:action_controller){ prepend_view_path(views) }
        ActiveSupport.on_load(:action_mailer){ prepend_view_path(views) }
      end
    end

    initializer :load_environment_config, :before => :load_environment_hook, :group => :all do
      environment = paths["config/environments"].existent.first
      require environment if environment
    end

    initializer :append_assets_path, :group => :all do |app|
      app.config.assets.paths.unshift(*paths["vendor/assets"].existent_directories)
      app.config.assets.paths.unshift(*paths["lib/assets"].existent_directories)
      app.config.assets.paths.unshift(*paths["app/assets"].existent_directories)
    end

    initializer :prepend_helpers_path do |app|
      if !isolated? || (app == self)
        app.config.helpers_paths.unshift(*paths["app/helpers"].existent)
      end
    end

    initializer :load_config_initializers do
      config.paths["config/initializers"].existent.sort.each do |initializer|
        load(initializer)
      end
    end

    initializer :engines_blank_point do
      # We need this initializer so all extra initializers added in engines are
      # consistently executed after all the initializers above across all engines.
    end

    rake_tasks do
      next if self.is_a?(Rails::Application)
      next unless has_migrations?

      namespace railtie_name do
        namespace :install do
          desc "Copy migrations from #{railtie_name} to application"
          task :migrations do
            ENV["FROM"] = railtie_name
            Rake::Task["railties:install:migrations"].invoke
          end
        end
      end
    end

  protected

    def initialize_generators
      require "rails/generators"
    end

    def routes?
      defined?(@routes)
    end

    def has_migrations?
      paths["db/migrate"].existent.any?
    end

    def find_root_with_flag(flag, default=nil)
      root_path = self.class.called_from

      while root_path && File.directory?(root_path) && !File.exist?("#{root_path}/#{flag}")
        parent = File.dirname(root_path)
        root_path = parent != root_path && parent
      end

      root = File.exist?("#{root_path}/#{flag}") ? root_path : default
      raise "Could not find root path for #{self}" unless root

      RbConfig::CONFIG['host_os'] =~ /mswin|mingw/ ?
        Pathname.new(root).expand_path : Pathname.new(root).realpath
    end

    def default_middleware_stack
      ActionDispatch::MiddlewareStack.new
    end

    def _all_autoload_once_paths
      config.autoload_once_paths
    end

    def _all_autoload_paths
      @_all_autoload_paths ||= (config.autoload_paths + config.eager_load_paths + config.autoload_once_paths).uniq
    end

    def _all_load_paths
      @_all_load_paths ||= (config.paths.load_paths + _all_autoload_paths).uniq
    end
  end
end
require 'open-uri'
require 'rbconfig'
require 'active_support/core_ext/array/wrap'

module Rails
  module Generators
    module Actions

      # Install a plugin. You must provide either a Subversion url or Git url.
      #
      # For a Git-hosted plugin, you can specify a branch and
      # whether it should be added as a submodule instead of cloned.
      #
      # For a Subversion-hosted plugin you can specify a revision.
      #
      # ==== Examples
      #
      #   plugin 'restful-authentication', :git => 'git://github.com/technoweenie/restful-authentication.git'
      #   plugin 'restful-authentication', :git => 'git://github.com/technoweenie/restful-authentication.git', :branch => 'stable'
      #   plugin 'restful-authentication', :git => 'git://github.com/technoweenie/restful-authentication.git', :submodule => true
      #   plugin 'restful-authentication', :svn => 'svn://svnhub.com/technoweenie/restful-authentication/trunk'
      #   plugin 'restful-authentication', :svn => 'svn://svnhub.com/technoweenie/restful-authentication/trunk', :revision => 1234
      #
      def plugin(name, options)
        log :plugin, name

        if options[:git] && options[:submodule]
          options[:git] = "-b #{options[:branch]} #{options[:git]}" if options[:branch]
          in_root do
            run "git submodule add #{options[:git]} vendor/plugins/#{name}", :verbose => false
          end
        elsif options[:git] || options[:svn]
          options[:git] = "-b #{options[:branch]} #{options[:git]}"   if options[:branch]
          options[:svn] = "-r #{options[:revision]} #{options[:svn]}" if options[:revision]
          in_root do
            run_ruby_script "script/rails plugin install #{options[:svn] || options[:git]}", :verbose => false
          end
        else
          log "! no git or svn provided for #{name}. Skipping..."
        end
      end

      # Adds an entry into Gemfile for the supplied gem. If env
      # is specified, add the gem to the given environment.
      #
      # ==== Example
      #
      #   gem "rspec", :group => :test
      #   gem "technoweenie-restful-authentication", :lib => "restful-authentication", :source => "http://gems.github.com/"
      #   gem "rails", "3.0", :git => "git://github.com/rails/rails"
      #
      def gem(*args)
        options = args.extract_options!
        name, version = args

        # Set the message to be shown in logs. Uses the git repo if one is given,
        # otherwise use name (version).
        parts, message = [ name.inspect ], name
        if version ||= options.delete(:version)
          parts   << version.inspect
          message << " (#{version})"
        end
        message = options[:git] if options[:git]

        log :gemfile, message

        options.each do |option, value|
          parts << ":#{option} => #{value.inspect}"
        end

        in_root do
          str = "gem #{parts.join(", ")}"
          str = "  " + str if @in_group
          str = "\n" + str
          append_file "Gemfile", str, :verbose => false
        end
      end

      # Wraps gem entries inside a group.
      #
      # ==== Example
      #
      #   gem_group :development, :test do
      #     gem "rspec-rails"
      #   end
      #
      def gem_group(*names, &block)
        name = names.map(&:inspect).join(", ")
        log :gemfile, "group #{name}"

        in_root do
          append_file "Gemfile", "\ngroup #{name} do", :force => true

          @in_group = true
          instance_eval(&block)
          @in_group = false

          append_file "Gemfile", "\nend\n", :force => true
        end
      end

      # Add the given source to Gemfile
      #
      # ==== Example
      #
      #   add_source "http://gems.github.com/"
      def add_source(source, options={})
        log :source, source

        in_root do
          prepend_file "Gemfile", "source #{source.inspect}\n", :verbose => false
        end
      end

      # Adds a line inside the Application class for config/application.rb.
      #
      # If options :env is specified, the line is appended to the corresponding
      # file in config/environments.
      #
      def environment(data=nil, options={}, &block)
        sentinel = /class [a-z_:]+ < Rails::Application/i
        env_file_sentinel = /::Application\.configure do/
        data = block.call if !data && block_given?

        in_root do
          if options[:env].nil?
            inject_into_file 'config/application.rb', "\n    #{data}", :after => sentinel, :verbose => false
          else
            Array.wrap(options[:env]).each do |env|
              inject_into_file "config/environments/#{env}.rb", "\n  #{data}", :after => env_file_sentinel, :verbose => false
            end
          end
        end
      end
      alias :application :environment

      # Run a command in git.
      #
      # ==== Examples
      #
      #   git :init
      #   git :add => "this.file that.rb"
      #   git :add => "onefile.rb", :rm => "badfile.cxx"
      #
      def git(commands={})
        if commands.is_a?(Symbol)
          run "git #{commands}"
        else
          commands.each do |cmd, options|
            run "git #{cmd} #{options}"
          end
        end
      end

      # Create a new file in the vendor/ directory. Code can be specified
      # in a block or a data string can be given.
      #
      # ==== Examples
      #
      #   vendor("sekrit.rb") do
      #     sekrit_salt = "#{Time.now}--#{3.years.ago}--#{rand}--"
      #     "salt = '#{sekrit_salt}'"
      #   end
      #
      #   vendor("foreign.rb", "# Foreign code is fun")
      #
      def vendor(filename, data=nil, &block)
        log :vendor, filename
        create_file("vendor/#{filename}", data, :verbose => false, &block)
      end

      # Create a new file in the lib/ directory. Code can be specified
      # in a block or a data string can be given.
      #
      # ==== Examples
      #
      #   lib("crypto.rb") do
      #     "crypted_special_value = '#{rand}--#{Time.now}--#{rand(1337)}--'"
      #   end
      #
      #   lib("foreign.rb", "# Foreign code is fun")
      #
      def lib(filename, data=nil, &block)
        log :lib, filename
        create_file("lib/#{filename}", data, :verbose => false, &block)
      end

      # Create a new Rakefile with the provided code (either in a block or a string).
      #
      # ==== Examples
      #
      #   rakefile("bootstrap.rake") do
      #     project = ask("What is the UNIX name of your project?")
      #
      #     <<-TASK
      #       namespace :#{project} do
      #         task :bootstrap do
      #           puts "i like boots!"
      #         end
      #       end
      #     TASK
      #   end
      #
      #   rakefile("seed.rake", "puts 'im plantin ur seedz'")
      #
      def rakefile(filename, data=nil, &block)
        log :rakefile, filename
        create_file("lib/tasks/#{filename}", data, :verbose => false, &block)
      end

      # Create a new initializer with the provided code (either in a block or a string).
      #
      # ==== Examples
      #
      #   initializer("globals.rb") do
      #     data = ""
      #
      #     ['MY_WORK', 'ADMINS', 'BEST_COMPANY_EVAR'].each do |const|
      #       data << "#{const} = :entp\n"
      #     end
      #
      #     data
      #   end
      #
      #   initializer("api.rb", "API_KEY = '123456'")
      #
      def initializer(filename, data=nil, &block)
        log :initializer, filename
        create_file("config/initializers/#{filename}", data, :verbose => false, &block)
      end

      # Generate something using a generator from Rails or a plugin.
      # The second parameter is the argument string that is passed to
      # the generator or an Array that is joined.
      #
      # ==== Example
      #
      #   generate(:authenticated, "user session")
      #
      def generate(what, *args)
        log :generate, what
        argument = args.map {|arg| arg.to_s }.flatten.join(" ")

        in_root { run_ruby_script("script/rails generate #{what} #{argument}", :verbose => false) }
      end

      # Runs the supplied rake task
      #
      # ==== Example
      #
      #   rake("db:migrate")
      #   rake("db:migrate", :env => "production")
      #   rake("gems:install", :sudo => true)
      #
      def rake(command, options={})
        log :rake, command
        env  = options[:env] || ENV["RAILS_ENV"] || 'development'
        sudo = options[:sudo] && RbConfig::CONFIG['host_os'] !~ /mswin|mingw/ ? 'sudo ' : ''
        in_root { run("#{sudo}#{extify(:rake)} #{command} RAILS_ENV=#{env}", :verbose => false) }
      end

      # Just run the capify command in root
      #
      # ==== Example
      #
      #   capify!
      #
      def capify!
        log :capify, ""
        in_root { run("#{extify(:capify)} .", :verbose => false) }
      end

      # Make an entry in Rails routing file config/routes.rb
      #
      # === Example
      #
      #   route "root :to => 'welcome'"
      #
      def route(routing_code)
        log :route, routing_code
        sentinel = /\.routes\.draw do(?:\s*\|map\|)?\s*$/

        in_root do
          inject_into_file 'config/routes.rb', "\n  #{routing_code}\n", { :after => sentinel, :verbose => false }
        end
      end

      # Reads the given file at the source root and prints it in the console.
      #
      # === Example
      #
      #   readme "README"
      #
      def readme(path)
        log File.read(find_in_source_paths(path))
      end

      protected

        # Define log for backwards compatibility. If just one argument is sent,
        # invoke say, otherwise invoke say_status. Differently from say and
        # similarly to say_status, this method respects the quiet? option given.
        #
        def log(*args)
          if args.size == 1
            say args.first.to_s unless options.quiet?
          else
            args << (self.behavior == :invoke ? :green : :red)
            say_status(*args)
          end
        end

        # Add an extension to the given name based on the platform.
        #
        def extify(name)
          if RbConfig::CONFIG['host_os'] =~ /mswin|mingw/
            "#{name}.bat"
          else
            name
          end
        end

    end
  end
end
module Rails
  module Generators
    # ActiveModel is a class to be implemented by each ORM to allow Rails to
    # generate customized controller code.
    #
    # The API has the same methods as ActiveRecord, but each method returns a
    # string that matches the ORM API.
    #
    # For example:
    #
    #   ActiveRecord::Generators::ActiveModel.find(Foo, "params[:id]")
    #   # => "Foo.find(params[:id])"
    #
    #   Datamapper::Generators::ActiveModel.find(Foo, "params[:id]")
    #   # => "Foo.get(params[:id])"
    #
    # On initialization, the ActiveModel accepts the instance name that will
    # receive the calls:
    #
    #   builder = ActiveRecord::Generators::ActiveModel.new "@foo"
    #   builder.save # => "@foo.save"
    #
    # The only exception in ActiveModel for ActiveRecord is the use of self.build
    # instead of self.new.
    #
    class ActiveModel
      attr_reader :name

      def initialize(name)
        @name = name
      end

      # GET index
      def self.all(klass)
        "#{klass}.all"
      end

      # GET show
      # GET edit
      # PUT update
      # DELETE destroy
      def self.find(klass, params=nil)
        "#{klass}.find(#{params})"
      end

      # GET new
      # POST create
      def self.build(klass, params=nil)
        if params
          "#{klass}.new(#{params})"
        else
          "#{klass}.new"
        end
      end

      # POST create
      def save
        "#{name}.save"
      end

      # PUT update
      def update_attributes(params=nil)
        "#{name}.update_attributes(#{params})"
      end

      # POST create
      # PUT update
      def errors
        "#{name}.errors"
      end

      # DELETE destroy
      def destroy
        "#{name}.destroy"
      end
    end
  end
end
require 'digest/md5'
require 'securerandom'
require 'active_support/core_ext/string/strip'
require 'rails/version' unless defined?(Rails::VERSION)
require 'rbconfig'
require 'open-uri'
require 'uri'

module Rails
  module Generators
    class AppBase < Base
      DATABASES = %w( mysql oracle postgresql sqlite3 frontbase ibm_db sqlserver )
      JDBC_DATABASES = %w( jdbcmysql jdbcsqlite3 jdbcpostgresql jdbc )
      DATABASES.concat(JDBC_DATABASES)

      attr_accessor :rails_template
      add_shebang_option!

      argument :app_path,               :type => :string

      def self.add_shared_options_for(name)
        class_option :builder,            :type => :string, :aliases => "-b",
                                          :desc => "Path to a #{name} builder (can be a filesystem path or URL)"

        class_option :template,           :type => :string, :aliases => "-m",
                                          :desc => "Path to an #{name} template (can be a filesystem path or URL)"

        class_option :skip_gemfile,       :type => :boolean, :default => false,
                                          :desc => "Don't create a Gemfile"

        class_option :skip_bundle,        :type => :boolean, :default => false,
                                          :desc => "Don't run bundle install"

        class_option :skip_git,           :type => :boolean, :aliases => "-G", :default => false,
                                          :desc => "Skip Git ignores and keeps"

        class_option :skip_active_record, :type => :boolean, :aliases => "-O", :default => false,
                                          :desc => "Skip Active Record files"

        class_option :skip_sprockets,     :type => :boolean, :aliases => "-S", :default => false,
                                          :desc => "Skip Sprockets files"

        class_option :database,           :type => :string, :aliases => "-d", :default => "sqlite3",
                                          :desc => "Preconfigure for selected database (options: #{DATABASES.join('/')})"

        class_option :javascript,         :type => :string, :aliases => '-j', :default => 'jquery',
                                          :desc => 'Preconfigure for selected JavaScript library'

        class_option :skip_javascript,    :type => :boolean, :aliases => "-J", :default => false,
                                          :desc => "Skip JavaScript files"

        class_option :dev,                :type => :boolean, :default => false,
                                          :desc => "Setup the #{name} with Gemfile pointing to your Rails checkout"

        class_option :edge,               :type => :boolean, :default => false,
                                          :desc => "Setup the #{name} with Gemfile pointing to Rails repository"

        class_option :skip_test_unit,     :type => :boolean, :aliases => "-T", :default => false,
                                          :desc => "Skip Test::Unit files"

        class_option :help,               :type => :boolean, :aliases => "-h", :group => :rails,
                                          :desc => "Show this help message and quit"

        class_option :old_style_hash,     :type => :boolean, :default => false,
                                          :desc => "Force using old style hash (:foo => 'bar') on Ruby >= 1.9"
      end

      def initialize(*args)
        @original_wd = Dir.pwd
        super
        convert_database_option_for_jruby
      end

    protected

      def builder
        @builder ||= begin
          if path = options[:builder]
            if URI(path).is_a?(URI::HTTP)
              contents = open(path, "Accept" => "application/x-thor-template") {|io| io.read }
            else
              contents = open(File.expand_path(path, @original_wd)) {|io| io.read }
            end

            prok = eval("proc { #{contents} }", TOPLEVEL_BINDING, path, 1)
            instance_eval(&prok)
          end

          builder_class = get_builder_class
          builder_class.send(:include, ActionMethods)
          builder_class.new(self)
        end
      end

      def build(meth, *args)
        builder.send(meth, *args) if builder.respond_to?(meth)
      end

      def create_root
        self.destination_root = File.expand_path(app_path, destination_root)
        valid_const?

        empty_directory '.'
        set_default_accessors!
        FileUtils.cd(destination_root) unless options[:pretend]
      end

      def apply_rails_template
        apply rails_template if rails_template
      rescue Thor::Error, LoadError, Errno::ENOENT => e
        raise Error, "The template [#{rails_template}] could not be loaded. Error: #{e}"
      end

      def set_default_accessors!
        self.rails_template = case options[:template]
          when /^https?:\/\//
            options[:template]
          when String
            File.expand_path(options[:template], Dir.pwd)
          else
            options[:template]
        end
      end

      def database_gemfile_entry
        options[:skip_active_record] ? "" : "gem '#{gem_for_database}'\n"
      end

      def include_all_railties?
        !options[:skip_active_record] && !options[:skip_test_unit] && !options[:skip_sprockets]
      end

      def comment_if(value)
        options[value] ? '# ' : ''
      end

      def rails_gemfile_entry
        if options.dev?
          <<-GEMFILE.strip_heredoc
            gem 'rails',     :path => '#{Rails::Generators::RAILS_DEV_PATH}'
            gem 'journey',   :git => 'git://github.com/rails/journey.git', :branch => '1-0-stable'
            gem 'arel',      :git => 'git://github.com/rails/arel.git', :branch => '3-0-stable'
          GEMFILE
        elsif options.edge?
          <<-GEMFILE.strip_heredoc
            gem 'rails',     :git => 'git://github.com/rails/rails.git', :branch => '3-2-stable'
            gem 'journey',   :git => 'git://github.com/rails/journey.git', :branch => '1-0-stable'
            gem 'arel',      :git => 'git://github.com/rails/arel.git', :branch => '3-0-stable'
          GEMFILE
        else
          <<-GEMFILE.strip_heredoc
            gem 'rails', '#{Rails::VERSION::STRING}'

            # Bundle edge Rails instead:
            # gem 'rails', :git => 'git://github.com/rails/rails.git'
          GEMFILE
        end
      end

      def gem_for_database
        # %w( mysql oracle postgresql sqlite3 frontbase ibm_db sqlserver jdbcmysql jdbcsqlite3 jdbcpostgresql )
        case options[:database]
        when "oracle"         then "ruby-oci8"
        when "postgresql"     then "pg"
        when "frontbase"      then "ruby-frontbase"
        when "mysql"          then "mysql2"
        when "sqlserver"      then "activerecord-sqlserver-adapter"
        when "jdbcmysql"      then "activerecord-jdbcmysql-adapter"
        when "jdbcsqlite3"    then "activerecord-jdbcsqlite3-adapter"
        when "jdbcpostgresql" then "activerecord-jdbcpostgresql-adapter"
        when "jdbc"           then "activerecord-jdbc-adapter"
        else options[:database]
        end
      end

      def convert_database_option_for_jruby
        if defined?(JRUBY_VERSION)
          case options[:database]
          when "oracle"     then options[:database].replace "jdbc"
          when "postgresql" then options[:database].replace "jdbcpostgresql"
          when "mysql"      then options[:database].replace "jdbcmysql"
          when "sqlite3"    then options[:database].replace "jdbcsqlite3"
          end
        end
      end

      def ruby_debugger_gemfile_entry
        if RUBY_VERSION < "1.9"
          "gem 'ruby-debug'"
        else
          "gem 'debugger'"
        end
      end

      def assets_gemfile_entry
        return if options[:skip_sprockets]

        gemfile = if options.dev? || options.edge?
          <<-GEMFILE
            # Gems used only for assets and not required
            # in production environments by default.
            group :assets do
              gem 'sass-rails',   :git => 'git://github.com/rails/sass-rails.git', :branch => '3-2-stable'
              gem 'coffee-rails', :git => 'git://github.com/rails/coffee-rails.git', :branch => '3-2-stable'

              # See https://github.com/sstephenson/execjs#readme for more supported runtimes
              #{javascript_runtime_gemfile_entry}
              gem 'uglifier', '>= 1.0.3'
            end
          GEMFILE
        else
          <<-GEMFILE
            # Gems used only for assets and not required
            # in production environments by default.
            group :assets do
              gem 'sass-rails',   '~> 3.2.3'
              gem 'coffee-rails', '~> 3.2.1'

              # See https://github.com/sstephenson/execjs#readme for more supported runtimes
              #{javascript_runtime_gemfile_entry}
              gem 'uglifier', '>= 1.0.3'
            end
          GEMFILE
        end

        gemfile.strip_heredoc.gsub(/^[ \t]*$/, '')
      end

      def javascript_gemfile_entry
        "gem '#{options[:javascript]}-rails'" unless options[:skip_javascript]
      end

      def javascript_runtime_gemfile_entry
        if defined?(JRUBY_VERSION)
          "gem 'therubyrhino'\n"
        else
          "# gem 'therubyracer', :platforms => :ruby\n"
        end
      end

      def bundle_command(command)
        say_status :run, "bundle #{command}"

        # We are going to shell out rather than invoking Bundler::CLI.new(command)
        # because `rails new` loads the Thor gem and on the other hand bundler uses
        # its own vendored Thor, which could be a different version. Running both
        # things in the same process is a recipe for a night with paracetamol.
        #
        # We use backticks and #print here instead of vanilla #system because it
        # is easier to silence stdout in the existing test suite this way. The
        # end-user gets the bundler commands called anyway, so no big deal.
        #
        # Thanks to James Tucker for the Gem tricks involved in this call.
        print `"#{Gem.ruby}" -rubygems "#{Gem.bin_path('bundler', 'bundle')}" #{command}`
      end

      def run_bundle
        bundle_command('install') unless options[:skip_gemfile] || options[:skip_bundle]
      end

      def empty_directory_with_gitkeep(destination, config = {})
        empty_directory(destination, config)
        git_keep(destination)
      end

      def git_keep(destination)
        create_file("#{destination}/.gitkeep") unless options[:skip_git]
      end

      # Returns Ruby 1.9 style key-value pair if current code is running on
      # Ruby 1.9.x. Returns the old-style (with hash rocket) otherwise.
      def key_value(key, value)
        if options[:old_style_hash] || RUBY_VERSION < '1.9'
          ":#{key} => #{value}"
        else
          "#{key}: #{value}"
        end
      end
    end
  end
end
begin
  require 'thor/group'
rescue LoadError
  puts "Thor is not available.\nIf you ran this command from a git checkout " \
       "of Rails, please make sure thor is installed,\nand run this command " \
       "as `ruby #{$0} #{(ARGV | ['--dev']).join(" ")}`"
  exit
end

require 'rails/generators/actions'
require 'active_support/core_ext/object/inclusion'

module Rails
  module Generators
    class Error < Thor::Error
    end

    class Base < Thor::Group
      include Thor::Actions
      include Rails::Generators::Actions

      add_runtime_options!
      strict_args_position! if respond_to?(:strict_args_position!)

      # Returns the source root for this generator using default_source_root as default.
      def self.source_root(path=nil)
        @_source_root = path if path
        @_source_root ||= default_source_root
      end

      # Tries to get the description from a USAGE file one folder above the source
      # root otherwise uses a default description.
      def self.desc(description=nil)
        return super if description

        @desc ||= if usage_path
          ERB.new(File.read(usage_path)).result(binding)
        else
          "Description:\n    Create #{base_name.humanize.downcase} files for #{generator_name} generator."
        end
      end

      # Convenience method to get the namespace from the class name. It's the
      # same as Thor default except that the Generator at the end of the class
      # is removed.
      def self.namespace(name=nil)
        return super if name
        @namespace ||= super.sub(/_generator$/, '').sub(/:generators:/, ':')
      end

      # Invoke a generator based on the value supplied by the user to the
      # given option named "name". A class option is created when this method
      # is invoked and you can set a hash to customize it.
      #
      # ==== Examples
      #
      #   module Rails::Generators
      #     class ControllerGenerator < Base
      #       hook_for :test_framework, :aliases => "-t"
      #     end
      #   end
      #
      # The example above will create a test framework option and will invoke
      # a generator based on the user supplied value.
      #
      # For example, if the user invoke the controller generator as:
      #
      #   rails generate controller Account --test-framework=test_unit
      #
      # The controller generator will then try to invoke the following generators:
      #
      #   "rails:test_unit", "test_unit:controller", "test_unit"
      #
      # Notice that "rails:generators:test_unit" could be loaded as well, what
      # Rails looks for is the first and last parts of the namespace. This is what
      # allows any test framework to hook into Rails as long as it provides any
      # of the hooks above.
      #
      # ==== Options
      #
      # The first and last part used to find the generator to be invoked are
      # guessed based on class invokes hook_for, as noticed in the example above.
      # This can be customized with two options: :base and :as.
      #
      # Let's suppose you are creating a generator that needs to invoke the
      # controller generator from test unit. Your first attempt is:
      #
      #   class AwesomeGenerator < Rails::Generators::Base
      #     hook_for :test_framework
      #   end
      #
      # The lookup in this case for test_unit as input is:
      #
      #   "test_framework:awesome", "test_framework"
      #
      # Which is not the desired the lookup. You can change it by providing the
      # :as option:
      #
      #   class AwesomeGenerator < Rails::Generators::Base
      #     hook_for :test_framework, :as => :controller
      #   end
      #
      # And now it will lookup at:
      #
      #   "test_framework:controller", "test_framework"
      #
      # Similarly, if you want it to also lookup in the rails namespace, you just
      # need to provide the :base value:
      #
      #   class AwesomeGenerator < Rails::Generators::Base
      #     hook_for :test_framework, :in => :rails, :as => :controller
      #   end
      #
      # And the lookup is exactly the same as previously:
      #
      #   "rails:test_framework", "test_framework:controller", "test_framework"
      #
      # ==== Switches
      #
      # All hooks come with switches for user interface. If you do not want
      # to use any test framework, you can do:
      #
      #   rails generate controller Account --skip-test-framework
      #
      # Or similarly:
      #
      #   rails generate controller Account --no-test-framework
      #
      # ==== Boolean hooks
      #
      # In some cases, you may want to provide a boolean hook. For example, webrat
      # developers might want to have webrat available on controller generator.
      # This can be achieved as:
      #
      #   Rails::Generators::ControllerGenerator.hook_for :webrat, :type => :boolean
      #
      # Then, if you want webrat to be invoked, just supply:
      #
      #   rails generate controller Account --webrat
      #
      # The hooks lookup is similar as above:
      #
      #   "rails:generators:webrat", "webrat:generators:controller", "webrat"
      #
      # ==== Custom invocations
      #
      # You can also supply a block to hook_for to customize how the hook is
      # going to be invoked. The block receives two arguments, an instance
      # of the current class and the class to be invoked.
      #
      # For example, in the resource generator, the controller should be invoked
      # with a pluralized class name. But by default it is invoked with the same
      # name as the resource generator, which is singular. To change this, we
      # can give a block to customize how the controller can be invoked.
      #
      #   hook_for :resource_controller do |instance, controller|
      #     instance.invoke controller, [ instance.name.pluralize ]
      #   end
      #
      def self.hook_for(*names, &block)
        options = names.extract_options!
        in_base = options.delete(:in) || base_name
        as_hook = options.delete(:as) || generator_name

        names.each do |name|
          defaults = if options[:type] == :boolean
            { }
          elsif default_value_for_option(name, options).in?([true, false])
            { :banner => "" }
          else
            { :desc => "#{name.to_s.humanize} to be invoked", :banner => "NAME" }
          end

          unless class_options.key?(name)
            class_option(name, defaults.merge!(options))
          end

          hooks[name] = [ in_base, as_hook ]
          invoke_from_option(name, options, &block)
        end
      end

      # Remove a previously added hook.
      #
      # ==== Examples
      #
      #   remove_hook_for :orm
      #
      def self.remove_hook_for(*names)
        remove_invocation(*names)

        names.each do |name|
          hooks.delete(name)
        end
      end

      # Make class option aware of Rails::Generators.options and Rails::Generators.aliases.
      def self.class_option(name, options={}) #:nodoc:
        options[:desc]    = "Indicates when to generate #{name.to_s.humanize.downcase}" unless options.key?(:desc)
        options[:aliases] = default_aliases_for_option(name, options)
        options[:default] = default_value_for_option(name, options)
        super(name, options)
      end

      # Returns the default source root for a given generator. This is used internally
      # by rails to set its generators source root. If you want to customize your source
      # root, you should use source_root.
      def self.default_source_root
        return unless base_name && generator_name
        return unless default_generator_root
        path = File.join(default_generator_root, 'templates')
        path if File.exists?(path)
      end

      # Returns the base root for a common set of generators. This is used to dynamically
      # guess the default source root.
      def self.base_root
        File.dirname(__FILE__)
      end

      # Cache source root and add lib/generators/base/generator/templates to
      # source paths.
      def self.inherited(base) #:nodoc:
        super

        # Invoke source_root so the default_source_root is set.
        base.source_root

        if base.name && base.name !~ /Base$/
          Rails::Generators.subclasses << base

          Rails::Generators.templates_path.each do |path|
            if base.name.include?('::')
              base.source_paths << File.join(path, base.base_name, base.generator_name)
            else
              base.source_paths << File.join(path, base.generator_name)
            end
          end
        end
      end

      protected

        # Check whether the given class names are already taken by user
        # application or Ruby on Rails.
        #
        def class_collisions(*class_names) #:nodoc:
          return unless behavior == :invoke

          class_names.flatten.each do |class_name|
            class_name = class_name.to_s
            next if class_name.strip.empty?

            # Split the class from its module nesting
            nesting = class_name.split('::')
            last_name = nesting.pop

            # Hack to limit const_defined? to non-inherited on 1.9
            extra = []
            extra << false unless Object.method(:const_defined?).arity == 1

            # Extract the last Module in the nesting
            last = nesting.inject(Object) do |last_module, nest|
              break unless last_module.const_defined?(nest, *extra)
              last_module.const_get(nest)
            end

            if last && last.const_defined?(last_name.camelize, *extra)
              raise Error, "The name '#{class_name}' is either already used in your application " <<
                           "or reserved by Ruby on Rails. Please choose an alternative and run "  <<
                           "this generator again."
            end
          end
        end

        # Use Rails default banner.
        #
        def self.banner
          "rails generate #{namespace.sub(/^rails:/,'')} #{self.arguments.map{ |a| a.usage }.join(' ')} [options]".gsub(/\s+/, ' ')
        end

        # Sets the base_name taking into account the current class namespace.
        #
        def self.base_name
          @base_name ||= begin
            if base = name.to_s.split('::').first
              base.underscore
            end
          end
        end

        # Removes the namespaces and get the generator name. For example,
        # Rails::Generators::ModelGenerator will return "model" as generator name.
        #
        def self.generator_name
          @generator_name ||= begin
            if generator = name.to_s.split('::').last
              generator.sub!(/Generator$/, '')
              generator.underscore
            end
          end
        end

        # Return the default value for the option name given doing a lookup in
        # Rails::Generators.options.
        #
        def self.default_value_for_option(name, options)
          default_for_option(Rails::Generators.options, name, options, options[:default])
        end

        # Return default aliases for the option name given doing a lookup in
        # Rails::Generators.aliases.
        #
        def self.default_aliases_for_option(name, options)
          default_for_option(Rails::Generators.aliases, name, options, options[:aliases])
        end

        # Return default for the option name given doing a lookup in config.
        #
        def self.default_for_option(config, name, options, default)
          if generator_name and c = config[generator_name.to_sym] and c.key?(name)
            c[name]
          elsif base_name and c = config[base_name.to_sym] and c.key?(name)
            c[name]
          elsif config[:rails].key?(name)
            config[:rails][name]
          else
            default
          end
        end

        # Keep hooks configuration that are used on prepare_for_invocation.
        #
        def self.hooks #:nodoc:
          @hooks ||= from_superclass(:hooks, {})
        end

        # Prepare class invocation to search on Rails namespace if a previous
        # added hook is being used.
        #
        def self.prepare_for_invocation(name, value) #:nodoc:
          return super unless value.is_a?(String) || value.is_a?(Symbol)

          if value && constants = self.hooks[name]
            value = name if TrueClass === value
            Rails::Generators.find_by_namespace(value, *constants)
          elsif klass = Rails::Generators.find_by_namespace(value)
            klass
          else
            super
          end
        end

        # Small macro to add ruby as an option to the generator with proper
        # default value plus an instance helper method called shebang.
        #
        def self.add_shebang_option!
          class_option :ruby, :type => :string, :aliases => "-r", :default => Thor::Util.ruby_command,
                              :desc => "Path to the Ruby binary of your choice", :banner => "PATH"

          no_tasks {
            define_method :shebang do
              @shebang ||= begin
                command = if options[:ruby] == Thor::Util.ruby_command
                  "/usr/bin/env #{File.basename(Thor::Util.ruby_command)}"
                else
                  options[:ruby]
                end
                "#!#{command}"
              end
            end
          }
        end

        def self.usage_path
          paths = [
            source_root && File.expand_path("../USAGE", source_root),
            default_generator_root && File.join(default_generator_root, "USAGE")
          ]
          paths.compact.detect { |path| File.exists? path }
        end

        def self.default_generator_root
          path = File.expand_path(File.join(base_name, generator_name), base_root)
          path if File.exists?(path)
        end

    end
  end
end
require "rails/generators/named_base"

module Css
  module Generators
    class AssetsGenerator < Rails::Generators::NamedBase
      source_root File.expand_path("../templates", __FILE__)

      def copy_stylesheet
        copy_file "stylesheet.css", File.join('app/assets/stylesheets', class_path, "#{file_name}.css")
      end
    end
  end
end
require "rails/generators/named_base"

module Css
  module Generators
    class ScaffoldGenerator < Rails::Generators::NamedBase
      # In order to allow the Sass generators to pick up the default Rails CSS and
      # transform it, we leave it in a standard location for the CSS stylesheet
      # generators to handle. For the simple, default case, just copy it over.
      def copy_stylesheet
        dir = Rails::Generators::ScaffoldGenerator.source_root
        file = File.join(dir, "scaffold.css")
        create_file "app/assets/stylesheets/scaffold.css", File.read(file)
      end
    end
  end
end
require 'rails/generators/erb'

module Erb
  module Generators
    class ControllerGenerator < Base
      argument :actions, :type => :array, :default => [], :banner => "action action"

      def copy_view_files
        base_path = File.join("app/views", class_path, file_name)
        empty_directory base_path

        actions.each do |action|
          @action = action
          @path = File.join(base_path, filename_with_extensions(action))
          template filename_with_extensions(:view), @path
        end
      end
    end
  end
end
require 'rails/generators/erb/controller/controller_generator'

module Erb
  module Generators
    class MailerGenerator < ControllerGenerator
      protected

      def format
        :text
      end
    end
  end
end
require 'rails/generators/erb'
require 'rails/generators/resource_helpers'

module Erb
  module Generators
    class ScaffoldGenerator < Base
      include Rails::Generators::ResourceHelpers

      argument :attributes, :type => :array, :default => [], :banner => "field:type field:type"

      def create_root_folder
        empty_directory File.join("app/views", controller_file_path)
      end

      def copy_view_files
        available_views.each do |view|
          filename = filename_with_extensions(view)
          template filename, File.join("app/views", controller_file_path, filename)
        end
      end

    protected

      def available_views
        %w(index edit show new _form)
      end
    end
  end
end
require 'rails/generators/named_base'

module Erb
  module Generators
    class Base < Rails::Generators::NamedBase #:nodoc:
      protected

      def format
        :html
      end

      def handler
        :erb
      end

      def filename_with_extensions(name)
        [name, format, handler].compact.join(".")
      end
    end
  end
end
require 'active_support/time'
require 'active_support/core_ext/object/inclusion'
require 'active_support/core_ext/object/blank'

module Rails
  module Generators
    class GeneratedAttribute
      attr_accessor :name, :type
      attr_reader   :attr_options

      class << self
        def parse(column_definition)
          name, type, has_index = column_definition.split(':')

          # if user provided "name:index" instead of "name:string:index"
          # type should be set blank so GeneratedAttribute's constructor
          # could set it to :string
          has_index, type = type, nil if %w(index uniq).include?(type)

          type, attr_options = *parse_type_and_options(type)
          new(name, type, has_index, attr_options)
        end

        private

        # parse possible attribute options like :limit for string/text/binary/integer or :precision/:scale for decimals
        # when declaring options curly brackets should be used
        def parse_type_and_options(type)
          case type
          when /(string|text|binary|integer)\{(\d+)\}/
            return $1, :limit => $2.to_i
          when /decimal\{(\d+)(,|\.|\-)(\d+)\}/
            return :decimal, :precision => $1.to_i, :scale => $3.to_i
          else
            return type, {}
          end
        end
      end

      def initialize(name, type=nil, index_type=false, attr_options={})
        @name           = name
        @type           = (type.presence || :string).to_sym
        @has_index      = %w(index uniq).include?(index_type)
        @has_uniq_index = %w(uniq).include?(index_type)
        @attr_options   = attr_options
      end

      def field_type
        @field_type ||= case type
          when :integer              then :number_field
          when :float, :decimal      then :text_field
          when :time                 then :time_select
          when :datetime, :timestamp then :datetime_select
          when :date                 then :date_select
          when :text                 then :text_area
          when :boolean              then :check_box
          else
            :text_field
        end
      end

      def default
        @default ||= case type
          when :integer                     then 1
          when :float                       then 1.5
          when :decimal                     then "9.99"
          when :datetime, :timestamp, :time then Time.now.to_s(:db)
          when :date                        then Date.today.to_s(:db)
          when :string                      then name == "type" ? "" : "MyString"
          when :text                        then "MyText"
          when :boolean                     then false
          when :references, :belongs_to     then nil
          else
            ""
        end
      end

      def human_name
        name.to_s.humanize
      end

      def index_name
        reference? ? "#{name}_id" : name
      end

      def reference?
        self.type.in?([:references, :belongs_to])
      end

      def has_index?
        @has_index
      end

      def has_uniq_index?
        @has_uniq_index
      end

      def inject_options
        "".tap { |s| @attr_options.each { |k,v| s << ", :#{k} => #{v.inspect}" } }
      end

      def inject_index_options
        has_uniq_index? ? ", :unique => true" : ''
      end
    end
  end
end
require "rails/generators/named_base"

module Js
  module Generators
    class AssetsGenerator < Rails::Generators::NamedBase
      source_root File.expand_path("../templates", __FILE__)

      def copy_javascript
        copy_file "javascript.js", File.join('app/assets/javascripts', class_path, "#{file_name}.js")
      end
    end
  end
end
module Rails
  module Generators
    # Holds common methods for migrations. It assumes that migrations has the
    # [0-9]*_name format and can be used by another frameworks (like Sequel)
    # just by implementing the next migration version method.
    #
    module Migration
      attr_reader :migration_number, :migration_file_name, :migration_class_name

      def self.included(base) #:nodoc:
        base.extend ClassMethods
      end

      module ClassMethods
        def migration_lookup_at(dirname) #:nodoc:
          Dir.glob("#{dirname}/[0-9]*_*.rb")
        end

        def migration_exists?(dirname, file_name) #:nodoc:
          migration_lookup_at(dirname).grep(/\d+_#{file_name}.rb$/).first
        end

        def current_migration_number(dirname) #:nodoc:
          migration_lookup_at(dirname).collect do |file|
            File.basename(file).split("_").first.to_i
          end.max.to_i
        end

        def next_migration_number(dirname) #:nodoc:
          raise NotImplementedError
        end
      end

      # Creates a migration template at the given destination. The difference
      # to the default template method is that the migration version is appended
      # to the destination file name.
      #
      # The migration version, migration file name, migration class name are
      # available as instance variables in the template to be rendered.
      #
      # ==== Examples
      #
      #   migration_template "migration.rb", "db/migrate/add_foo_to_bar.rb"
      #
      def migration_template(source, destination=nil, config={})
        destination = File.expand_path(destination || source, self.destination_root)

        migration_dir = File.dirname(destination)
        @migration_number     = self.class.next_migration_number(migration_dir)
        @migration_file_name  = File.basename(destination).sub(/\.rb$/, '')
        @migration_class_name = @migration_file_name.camelize

        destination = self.class.migration_exists?(migration_dir, @migration_file_name)

        if !(destination && options[:skip]) && behavior == :invoke
          if destination && options.force?
            remove_file(destination)
          elsif destination
            raise Error, "Another migration is already named #{@migration_file_name}: #{destination}"
          end
          destination = File.join(migration_dir, "#{@migration_number}_#{@migration_file_name}.rb")
        end

        template(source, destination, config)
      end
    end
  end
end
require 'active_support/core_ext/module/introspection'
require 'rails/generators/base'
require 'rails/generators/generated_attribute'

module Rails
  module Generators
    class NamedBase < Base
      argument :name, :type => :string
      class_option :skip_namespace, :type => :boolean, :default => false,
                                    :desc => "Skip namespace (affects only isolated applications)"

      class_option :old_style_hash, :type => :boolean, :default => false,
                                    :desc => "Force using old style hash (:foo => 'bar') on Ruby >= 1.9"

      def initialize(args, *options) #:nodoc:
        @inside_template = nil
        # Unfreeze name in case it's given as a frozen string
        args[0] = args[0].dup if args[0].is_a?(String) && args[0].frozen?
        super
        assign_names!(self.name)
        parse_attributes! if respond_to?(:attributes)
      end

      no_tasks do
        def template(source, *args, &block)
          inside_template do
            super
          end
        end
      end

      protected
        attr_reader :file_name
        alias :singular_name :file_name

        # Wrap block with namespace of current application
        # if namespace exists and is not skipped
        def module_namespacing(&block)
          content = capture(&block)
          content = wrap_with_namespace(content) if namespaced?
          concat(content)
        end

        def indent(content, multiplier = 2)
          spaces = " " * multiplier
          content = content.each_line.map {|line| "#{spaces}#{line}" }.join
        end

        def wrap_with_namespace(content)
          content = indent(content).chomp
          "module #{namespace.name}\n#{content}\nend\n"
        end

        def inside_template
          @inside_template = true
          yield
        ensure
          @inside_template = false
        end

        def inside_template?
          @inside_template
        end

        def namespace
          Rails::Generators.namespace
        end

        def namespaced?
          !options[:skip_namespace] && namespace
        end

        def file_path
          @file_path ||= (class_path + [file_name]).join('/')
        end

        def class_path
          inside_template? || !namespaced? ? regular_class_path : namespaced_class_path
        end

        def regular_class_path
          @class_path
        end

        def namespaced_file_path
          @namespaced_file_path ||= namespaced_class_path.join("/")
        end

        def namespaced_class_path
          @namespaced_class_path ||= begin
            namespace_path = namespace.name.split("::").map {|m| m.underscore }
            namespace_path + @class_path
          end
        end

        def class_name
          (class_path + [file_name]).map!{ |m| m.camelize }.join('::')
        end

        def human_name
          @human_name ||= singular_name.humanize
        end

        def plural_name
          @plural_name ||= singular_name.pluralize
        end

        def i18n_scope
          @i18n_scope ||= file_path.gsub('/', '.')
        end

        def table_name
          @table_name ||= begin
            base = pluralize_table_names? ? plural_name : singular_name
            (class_path + [base]).join('_')
          end
        end

        def uncountable?
          singular_name == plural_name
        end

        def index_helper
          uncountable? ? "#{plural_table_name}_index" : plural_table_name
        end

        def singular_table_name
          @singular_table_name ||= (pluralize_table_names? ? table_name.singularize : table_name)
        end

        def plural_table_name
          @plural_table_name ||= (pluralize_table_names? ? table_name : table_name.pluralize)
        end

        def plural_file_name
          @plural_file_name ||= file_name.pluralize
        end

        def route_url
          @route_url ||= class_path.collect{|dname| "/" + dname  }.join('') + "/" + plural_file_name
        end

        # Tries to retrieve the application name or simple return application.
        def application_name
          if defined?(Rails) && Rails.application
            Rails.application.class.name.split('::').first.underscore
          else
            "application"
          end
        end

        def assign_names!(name) #:nodoc:
          @class_path = name.include?('/') ? name.split('/') : name.split('::')
          @class_path.map! { |m| m.underscore }
          @file_name = @class_path.pop
        end

        # Convert attributes array into GeneratedAttribute objects.
        def parse_attributes! #:nodoc:
          self.attributes = (attributes || []).map do |attr|
            Rails::Generators::GeneratedAttribute.parse(attr)
          end
        end

        def pluralize_table_names?
          !defined?(ActiveRecord::Base) || ActiveRecord::Base.pluralize_table_names
        end

        # Add a class collisions name to be checked on class initialization. You
        # can supply a hash with a :prefix or :suffix to be tested.
        #
        # ==== Examples
        #
        #   check_class_collision :suffix => "Observer"
        #
        # If the generator is invoked with class name Admin, it will check for
        # the presence of "AdminObserver".
        #
        def self.check_class_collision(options={})
          define_method :check_class_collision do
            name = if self.respond_to?(:controller_class_name) # for ScaffoldBase
              controller_class_name
            else
              class_name
            end

            class_collisions "#{options[:prefix]}#{name}#{options[:suffix]}"
          end
        end

        # Returns Ruby 1.9 style key-value pair if current code is running on
        # Ruby 1.9.x. Returns the old-style (with hash rocket) otherwise.
        def key_value(key, value)
          if options[:old_style_hash] || RUBY_VERSION < '1.9'
            ":#{key} => #{value}"
          else
            "#{key}: #{value}"
          end
        end
    end
  end
end
require 'rails/generators/app_base'

module Rails
  module ActionMethods
    attr_reader :options

    def initialize(generator)
      @generator = generator
      @options   = generator.options
    end

    private
      %w(template copy_file directory empty_directory inside
         empty_directory_with_gitkeep create_file chmod shebang).each do |method|
        class_eval <<-RUBY, __FILE__, __LINE__ + 1
          def #{method}(*args, &block)
            @generator.send(:#{method}, *args, &block)
          end
        RUBY
      end

      # TODO: Remove once this is fully in place
      def method_missing(meth, *args, &block)
        @generator.send(meth, *args, &block)
      end
  end

  # The application builder allows you to override elements of the application
  # generator without being forced to reverse the operations of the default
  # generator.
  #
  # This allows you to override entire operations, like the creation of the
  # Gemfile, README, or JavaScript files, without needing to know exactly
  # what those operations do so you can create another template action.
  class AppBuilder
    def rakefile
      template "Rakefile"
    end

    def readme
      copy_file "README", "README.rdoc"
    end

    def gemfile
      template "Gemfile"
    end

    def configru
      template "config.ru"
    end

    def gitignore
      copy_file "gitignore", ".gitignore"
    end

    def app
      directory 'app'
      git_keep  'app/mailers'
      git_keep  'app/models'
    end

    def config
      empty_directory "config"

      inside "config" do
        template "routes.rb"
        template "application.rb"
        template "environment.rb"

        directory "environments"
        directory "initializers"
        directory "locales"
      end
    end

    def database_yml
      template "config/databases/#{options[:database]}.yml", "config/database.yml"
    end

    def db
      directory "db"
    end

    def doc
      directory "doc"
    end

    def lib
      empty_directory "lib"
      empty_directory_with_gitkeep "lib/tasks"
      empty_directory_with_gitkeep "lib/assets"
    end

    def log
      empty_directory_with_gitkeep "log"
    end

    def public_directory
      directory "public", "public", :recursive => false
    end

    def script
      directory "script" do |content|
        "#{shebang}\n" + content
      end
      chmod "script", 0755, :verbose => false
    end

    def test
      empty_directory_with_gitkeep "test/fixtures"
      empty_directory_with_gitkeep "test/functional"
      empty_directory_with_gitkeep "test/integration"
      empty_directory_with_gitkeep "test/unit"

      template "test/performance/browsing_test.rb"
      template "test/test_helper.rb"
    end

    def tmp
      empty_directory "tmp/cache"
      empty_directory "tmp/cache/assets"
    end

    def vendor
      vendor_javascripts
      vendor_stylesheets
      vendor_plugins
    end

    def vendor_javascripts
      empty_directory_with_gitkeep "vendor/assets/javascripts"
    end

    def vendor_stylesheets
      empty_directory_with_gitkeep "vendor/assets/stylesheets"
    end

    def vendor_plugins
      empty_directory_with_gitkeep "vendor/plugins"
    end
  end

  module Generators
    # We need to store the RAILS_DEV_PATH in a constant, otherwise the path
    # can change in Ruby 1.8.7 when we FileUtils.cd.
    RAILS_DEV_PATH = File.expand_path("../../../../../..", File.dirname(__FILE__))
    RESERVED_NAMES = %w[application destroy benchmarker profiler plugin runner test]

    class AppGenerator < AppBase
      add_shared_options_for "application"

      # Add bin/rails options
      class_option :version, :type => :boolean, :aliases => "-v", :group => :rails,
                             :desc => "Show Rails version number and quit"

      def initialize(*args)
        raise Error, "Options should be given after the application name. For details run: rails --help" if args[0].blank?

        super

        if !options[:skip_active_record] && !DATABASES.include?(options[:database])
          raise Error, "Invalid value for --database option. Supported for preconfiguration are: #{DATABASES.join(", ")}."
        end
      end

      public_task :create_root

      def create_root_files
        build(:readme)
        build(:rakefile)
        build(:configru)
        build(:gitignore) unless options[:skip_git]
        build(:gemfile)   unless options[:skip_gemfile]
      end

      def create_app_files
        build(:app)
      end

      def create_config_files
        build(:config)
      end

      def create_boot_file
        template "config/boot.rb"
      end

      def create_active_record_files
        return if options[:skip_active_record]
        build(:database_yml)
      end

      def create_db_files
        build(:db)
      end

      def create_doc_files
        build(:doc)
      end

      def create_lib_files
        build(:lib)
      end

      def create_log_files
        build(:log)
      end

      def create_public_files
        build(:public_directory)
      end

      def create_script_files
        build(:script)
      end

      def create_test_files
        build(:test) unless options[:skip_test_unit]
      end

      def create_tmp_files
        build(:tmp)
      end

      def create_vendor_files
        build(:vendor)
      end

      def finish_template
        build(:leftovers)
      end

      public_task :apply_rails_template, :run_bundle

    protected

      def self.banner
        "rails new #{self.arguments.map(&:usage).join(' ')} [options]"
      end

      # Define file as an alias to create_file for backwards compatibility.
      def file(*args, &block)
        create_file(*args, &block)
      end

      def app_name
        @app_name ||= defined_app_const_base? ? defined_app_name : File.basename(destination_root)
      end

      def defined_app_name
        defined_app_const_base.underscore
      end

      def defined_app_const_base
        Rails.respond_to?(:application) && defined?(Rails::Application) &&
          Rails.application.is_a?(Rails::Application) && Rails.application.class.name.sub(/::Application$/, "")
      end

      alias :defined_app_const_base? :defined_app_const_base

      def app_const_base
        @app_const_base ||= defined_app_const_base || app_name.gsub(/\W/, '_').squeeze('_').camelize
      end
      alias :camelized :app_const_base

      def app_const
        @app_const ||= "#{app_const_base}::Application"
      end

      def valid_const?
        if app_const =~ /^\d/
          raise Error, "Invalid application name #{app_name}. Please give a name which does not start with numbers."
        elsif RESERVED_NAMES.include?(app_name)
          raise Error, "Invalid application name #{app_name}. Please give a name which does not match one of the reserved rails words."
        elsif Object.const_defined?(app_const_base)
          raise Error, "Invalid application name #{app_name}, constant #{app_const_base} is already in use. Please choose another application name."
        end
      end

      def app_secret
        SecureRandom.hex(64)
      end

      def mysql_socket
        @mysql_socket ||= [
          "/tmp/mysql.sock",                        # default
          "/var/run/mysqld/mysqld.sock",            # debian/gentoo
          "/var/tmp/mysql.sock",                    # freebsd
          "/var/lib/mysql/mysql.sock",              # fedora
          "/opt/local/lib/mysql/mysql.sock",        # fedora
          "/opt/local/var/run/mysqld/mysqld.sock",  # mac + darwinports + mysql
          "/opt/local/var/run/mysql4/mysqld.sock",  # mac + darwinports + mysql4
          "/opt/local/var/run/mysql5/mysqld.sock",  # mac + darwinports + mysql5
          "/opt/lampp/var/mysql/mysql.sock"         # xampp for linux
        ].find { |f| File.exist?(f) } unless RbConfig::CONFIG['host_os'] =~ /mswin|mingw/
      end

      def get_builder_class
        defined?(::AppBuilder) ? ::AppBuilder : Rails::AppBuilder
      end
    end
  end
end
class ApplicationController < ActionController::Base
  protect_from_forgery
end
module ApplicationHelper
end
require File.expand_path('../boot', __FILE__)

<% if include_all_railties? -%>
require 'rails/all'
<% else -%>
# Pick the frameworks you want:
<%= comment_if :skip_active_record %>require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "active_resource/railtie"
<%= comment_if :skip_sprockets %>require "sprockets/railtie"
<%= comment_if :skip_test_unit %>require "rails/test_unit/railtie"
<% end -%>

if defined?(Bundler)
  # If you precompile assets before deploying to production, use this line
  Bundler.require(*Rails.groups(:assets => %w(development test)))
  # If you want your assets lazily compiled in production, use this line
  # Bundler.require(:default, :assets, Rails.env)
end

module <%= app_const_base %>
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Custom directories with classes and modules you want to be autoloadable.
    # config.autoload_paths += %W(#{config.root}/extras)

    # Only load the plugins named here, in the order given (default is alphabetical).
    # :all can be used as a placeholder for all plugins not explicitly named.
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

    # Activate observers that should always be running.
    # config.active_record.observers = :cacher, :garbage_collector, :forum_observer

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # Configure the default encoding used in templates for Ruby 1.9.
    config.encoding = "utf-8"

    # Configure sensitive parameters which will be filtered from the log file.
    config.filter_parameters += [:password]

    # Enable escaping HTML in JSON.
    config.active_support.escape_html_entities_in_json = true

    # Use SQL instead of Active Record's schema dumper when creating the database.
    # This is necessary if your schema can't be completely dumped by the schema dumper,
    # like if you have constraints or database-specific column types
    # config.active_record.schema_format = :sql

    # Enforce whitelist mode for mass assignment.
    # This will create an empty whitelist of attributes available for mass-assignment for all models
    # in your app. As such, your models will need to explicitly whitelist or blacklist accessible
    # parameters by using an attr_accessible or attr_protected declaration.
    <%= comment_if :skip_active_record %>config.active_record.whitelist_attributes = true

<% unless options.skip_sprockets? -%>
    # Enable the asset pipeline
    config.assets.enabled = true

    # Version of your assets, change this if you want to expire all your assets
    config.assets.version = '1.0'
<% end -%>
  end
end
require 'rubygems'

# Set up gems listed in the Gemfile.
ENV['BUNDLE_GEMFILE'] ||= File.expand_path('../../Gemfile', __FILE__)

require 'bundler/setup' if File.exists?(ENV['BUNDLE_GEMFILE'])
# Load the rails application
require File.expand_path('../application', __FILE__)

# Initialize the rails application
<%= app_const %>.initialize!
# Be sure to restart your server when you modify this file.

# You can add backtrace silencers for libraries that you're using but don't wish to see in your backtraces.
# Rails.backtrace_cleaner.add_silencer { |line| line =~ /my_noisy_library/ }

# You can also remove all the silencers if you're trying to debug a problem that might stem from framework code.
# Rails.backtrace_cleaner.remove_silencers!
# Be sure to restart your server when you modify this file.

# Add new inflection rules using the following format
# (all these examples are active by default):
# ActiveSupport::Inflector.inflections do |inflect|
#   inflect.plural /^(ox)$/i, '\1en'
#   inflect.singular /^(ox)en/i, '\1'
#   inflect.irregular 'person', 'people'
#   inflect.uncountable %w( fish sheep )
# end
#
# These inflection rules are supported but not enabled by default:
# ActiveSupport::Inflector.inflections do |inflect|
#   inflect.acronym 'RESTful'
# end
# Be sure to restart your server when you modify this file.

# Add new mime types for use in respond_to blocks:
# Mime::Type.register "text/richtext", :rtf
# Mime::Type.register_alias "text/html", :iphone
<%= app_const %>.routes.draw do
  # The priority is based upon order of creation:
  # first created -> highest priority.

  # Sample of regular route:
  #   match 'products/:id' => 'catalog#view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', :on => :collection
  #     end
  #   end

  # Sample resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end

  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.
  # root :to => 'welcome#index'

  # See how all your routes lay out with "rake routes"

  # This is a legacy wild controller route that's not recommended for RESTful applications.
  # Note: This route will make all actions in every controller accessible via GET requests.
  # match ':controller(/:action(/:id))(.:format)'
end
require 'test_helper'
require 'rails/performance_test_help'

class BrowsingTest < ActionDispatch::PerformanceTest
  # Refer to the documentation for all available options
  # self.profile_options = { :runs => 5, :metrics => [:wall_time, :memory]
  #                          :output => 'tmp/performance', :formats => [:flat] }

  def test_homepage
    get '/'
  end
end
ENV["RAILS_ENV"] = "test"
require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

class ActiveSupport::TestCase
<% unless options[:skip_active_record] -%>
  # Setup all fixtures in test/fixtures/*.(yml|csv) for all tests in alphabetical order.
  #
  # Note: You'll currently still have to declare fixtures explicitly in integration tests
  # -- they do not yet inherit this setting
  fixtures :all

<% end -%>
  # Add more helper methods to be used by all tests here...
end
module Rails
  module Generators
    class AssetsGenerator < NamedBase
      class_option :javascripts, :type => :boolean, :desc => "Generate JavaScripts"
      class_option :stylesheets, :type => :boolean, :desc => "Generate Stylesheets"

      class_option :javascript_engine, :desc => "Engine for JavaScripts"
      class_option :stylesheet_engine, :desc => "Engine for Stylesheets"

      protected

      def asset_name
        file_name
      end

      hook_for :javascript_engine do |javascript_engine|
        invoke javascript_engine, [name] if options[:javascripts]
      end

      hook_for :stylesheet_engine do |stylesheet_engine|
        invoke stylesheet_engine, [name] if options[:stylesheets]
      end
    end
  end
end
module Rails
  module Generators
    class ControllerGenerator < NamedBase
      argument :actions, :type => :array, :default => [], :banner => "action action"
      check_class_collision :suffix => "Controller"

      def create_controller_files
        template 'controller.rb', File.join('app/controllers', class_path, "#{file_name}_controller.rb")
      end

      def add_routes
        actions.reverse.each do |action|
          route %{get "#{file_name}/#{action}"}
        end
      end

      hook_for :template_engine, :test_framework, :helper, :assets
    end
  end
end
<% if namespaced? -%>
require_dependency "<%= namespaced_file_path %>/application_controller"

<% end -%>
<% module_namespacing do -%>
class <%= class_name %>Controller < ApplicationController
<% actions.each do |action| -%>
  def <%= action %>
  end
<%= "\n" unless action == actions.last -%>
<% end -%>
end
<% end -%>
module Rails
  module Generators
    class GeneratorGenerator < NamedBase
      check_class_collision :suffix => "Generator"

      class_option :namespace, :type => :boolean, :default => true,
                               :desc => "Namespace generator under lib/generators/name"

      def create_generator_files
        directory '.', generator_dir
      end

      protected

        def generator_dir
          if options[:namespace]
            File.join("lib", "generators", regular_class_path, file_name)
          else
            File.join("lib", "generators", regular_class_path)
          end
        end

    end
  end
end
module Rails
  module Generators
    class HelperGenerator < NamedBase
      check_class_collision :suffix => "Helper"

      def create_helper_files
        template 'helper.rb', File.join('app/helpers', class_path, "#{file_name}_helper.rb")
      end

      hook_for :test_framework
    end
  end
end
<% module_namespacing do -%>
module <%= class_name %>Helper
end
<% end -%>
module Rails
  module Generators
    class IntegrationTestGenerator < NamedBase
      hook_for :integration_tool, :as => :integration
    end
  end
end
module Rails
  module Generators
    class MigrationGenerator < NamedBase #metagenerator
      argument :attributes, :type => :array, :default => [], :banner => "field[:type][:index] field[:type][:index]"
      hook_for :orm, :required => true
    end
  end
end
module Rails
  module Generators
    class ModelGenerator < NamedBase #metagenerator
      argument :attributes, :type => :array, :default => [], :banner => "field[:type][:index] field[:type][:index]"
      hook_for :orm, :required => true
    end
  end
end
module Rails
  module Generators
    class ObserverGenerator < NamedBase #metagenerator
      hook_for :orm, :required => true
    end
  end
end
module Rails
  module Generators
    class PerformanceTestGenerator < NamedBase
      hook_for :performance_tool, :as => :performance
    end
  end
end
require 'active_support/core_ext/hash/slice'
require "rails/generators/rails/app/app_generator"
require 'date'

module Rails
  class PluginBuilder
    def rakefile
      template "Rakefile"
    end

    def app
      if mountable?
        directory "app"
        empty_directory_with_gitkeep "app/assets/images/#{name}"
      elsif full?
        empty_directory_with_gitkeep "app/models"
        empty_directory_with_gitkeep "app/controllers"
        empty_directory_with_gitkeep "app/views"
        empty_directory_with_gitkeep "app/helpers"
        empty_directory_with_gitkeep "app/mailers"
        empty_directory_with_gitkeep "app/assets/images/#{name}"
      end
    end

    def readme
      template "README.rdoc"
    end

    def gemfile
      template "Gemfile"
    end

    def license
      template "MIT-LICENSE"
    end

    def gemspec
      template "%name%.gemspec"
    end

    def gitignore
      template "gitignore", ".gitignore"
    end

    def lib
      template "lib/%name%.rb"
      template "lib/tasks/%name%_tasks.rake"
      template "lib/%name%/version.rb"
      if full?
        template "lib/%name%/engine.rb"
      end
    end

    def config
      template "config/routes.rb" if full?
    end

    def test
      template "test/test_helper.rb"
      template "test/%name%_test.rb"
      append_file "Rakefile", <<-EOF
#{rakefile_test_tasks}

task :default => :test
      EOF
      if full?
        template "test/integration/navigation_test.rb"
      end
    end

    PASSTHROUGH_OPTIONS = [
      :skip_active_record, :skip_javascript, :database, :javascript, :quiet, :pretend, :force, :skip
    ]

    def generate_test_dummy(force = false)
      opts = (options || {}).slice(*PASSTHROUGH_OPTIONS)
      opts[:force] = force
      opts[:skip_bundle] = true

      invoke Rails::Generators::AppGenerator,
        [ File.expand_path(dummy_path, destination_root) ], opts
    end

    def test_dummy_config
      template "rails/boot.rb", "#{dummy_path}/config/boot.rb", :force => true
      template "rails/application.rb", "#{dummy_path}/config/application.rb", :force => true
      if mountable?
        template "rails/routes.rb", "#{dummy_path}/config/routes.rb", :force => true
      end
    end

    def test_dummy_clean
      inside dummy_path do
        remove_file ".gitignore"
        remove_file "db/seeds.rb"
        remove_file "doc"
        remove_file "Gemfile"
        remove_file "lib/tasks"
        remove_file "app/assets/images/rails.png"
        remove_file "public/index.html"
        remove_file "public/robots.txt"
        remove_file "README"
        remove_file "test"
        remove_file "vendor"
      end
    end

    def stylesheets
      if mountable?
        copy_file "#{app_templates_dir}/app/assets/stylesheets/application.css",
                  "app/assets/stylesheets/#{name}/application.css"
      elsif full?
        empty_directory_with_gitkeep "app/assets/stylesheets/#{name}"
      end
    end

    def javascripts
      return if options.skip_javascript?

      if mountable?
        template "#{app_templates_dir}/app/assets/javascripts/application.js.tt",
                  "app/assets/javascripts/#{name}/application.js"
      elsif full?
        empty_directory_with_gitkeep "app/assets/javascripts/#{name}"
      end
    end

    def script(force = false)
      return unless full?

      directory "script", :force => force do |content|
        "#{shebang}\n" + content
      end
      chmod "script", 0755, :verbose => false
    end
  end

  module Generators
    class PluginNewGenerator < AppBase
      add_shared_options_for "plugin"

      alias_method :plugin_path, :app_path

      class_option :dummy_path,   :type => :string, :default => "test/dummy",
                                  :desc => "Create dummy application at given path"

      class_option :full,         :type => :boolean, :default => false,
                                  :desc => "Generate rails engine with integration tests"

      class_option :mountable,    :type => :boolean, :default => false,
                                  :desc => "Generate mountable isolated application"

      class_option :skip_gemspec, :type => :boolean, :default => false,
                                  :desc => "Skip gemspec file"

      def initialize(*args)
        raise Error, "Options should be given after the plugin name. For details run: rails plugin --help" if args[0].blank?

        @dummy_path = nil
        super
      end

      public_task :create_root

      def create_root_files
        build(:readme)
        build(:rakefile)
        build(:gemspec)   unless options[:skip_gemspec]
        build(:license)
        build(:gitignore) unless options[:skip_git]
        build(:gemfile)   unless options[:skip_gemfile]
      end

      def create_app_files
        build(:app)
      end

      def create_config_files
        build(:config)
      end

      def create_lib_files
        build(:lib)
      end

      def create_public_stylesheets_files
        build(:stylesheets)
      end

      def create_javascript_files
        build(:javascripts)
      end

      def create_images_directory
        build(:images)
      end

      def create_script_files
        build(:script)
      end

      def create_test_files
        build(:test) unless options[:skip_test_unit]
      end

      def create_test_dummy_files
        return if options[:skip_test_unit] && options[:dummy_path] == 'test/dummy'
        create_dummy_app
      end

      def finish_template
        build(:leftovers)
      end

      public_task :apply_rails_template, :run_bundle

    protected

      def app_templates_dir
        "../../app/templates"
      end

      def create_dummy_app(path = nil)
        dummy_path(path) if path

        say_status :vendor_app, dummy_path
        mute do
          build(:generate_test_dummy)
          store_application_definition!
          build(:test_dummy_config)
          build(:test_dummy_clean)
          # ensure that script/rails has proper dummy_path
          build(:script, true)
        end
      end

      def full?
        options[:full] || options[:mountable]
      end

      def mountable?
        options[:mountable]
      end

      def self.banner
        "rails plugin new #{self.arguments.map(&:usage).join(' ')} [options]"
      end

      def original_name
        @original_name ||= File.basename(destination_root)
      end

      def name
        @name ||= begin
          # same as ActiveSupport::Inflector#underscore except not replacing '-'
          underscored = original_name.dup
          underscored.gsub!(/([A-Z]+)([A-Z][a-z])/,'\1_\2')
          underscored.gsub!(/([a-z\d])([A-Z])/,'\1_\2')
          underscored.downcase!

          underscored
        end
      end

      def camelized
        @camelized ||= name.gsub(/\W/, '_').squeeze('_').camelize
      end

      def valid_const?
        if camelized =~ /^\d/
          raise Error, "Invalid plugin name #{original_name}. Please give a name which does not start with numbers."
        elsif RESERVED_NAMES.include?(name)
          raise Error, "Invalid plugin name #{original_name}. Please give a name which does not match one of the reserved rails words."
        elsif Object.const_defined?(camelized)
          raise Error, "Invalid plugin name #{original_name}, constant #{camelized} is already in use. Please choose another plugin name."
        end
      end

      def application_definition
        @application_definition ||= begin

          dummy_application_path = File.expand_path("#{dummy_path}/config/application.rb", destination_root)
          unless options[:pretend] || !File.exists?(dummy_application_path)
            contents = File.read(dummy_application_path)
            contents[(contents.index("module Dummy"))..-1]
          end
        end
      end
      alias :store_application_definition! :application_definition

      def get_builder_class
        defined?(::PluginBuilder) ? ::PluginBuilder : Rails::PluginBuilder
      end

      def rakefile_test_tasks
        <<-RUBY
require 'rake/testtask'

Rake::TestTask.new(:test) do |t|
  t.libs << 'lib'
  t.libs << 'test'
  t.pattern = 'test/**/*_test.rb'
  t.verbose = false
end
        RUBY
      end

      def dummy_path(path = nil)
        @dummy_path = path if path
        @dummy_path || options[:dummy_path]
      end

      def mute(&block)
        shell.mute(&block)
      end
    end
  end
end
<% if mountable? -%>
<%= camelized %>::Engine.routes.draw do
<% else -%>
Rails.application.routes.draw do
<% end -%>
end
module <%= camelized %>
  class Engine < ::Rails::Engine
<% if mountable? -%>
    isolate_namespace <%= camelized %>
<% end -%>
  end
end
module <%= camelized %>
  VERSION = "0.0.1"
end
<% if full? -%>
require "<%= name %>/engine"

<% end -%>
module <%= camelized %>
end
require File.expand_path('../boot', __FILE__)

<% if include_all_railties? -%>
require 'rails/all'
<% else -%>
# Pick the frameworks you want:
<%= comment_if :skip_active_record %>require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "active_resource/railtie"
<%= comment_if :skip_sprockets %>require "sprockets/railtie"
<%= comment_if :skip_test_unit %>require "rails/test_unit/railtie"
<% end -%>

Bundler.require
require "<%= name %>"

<%= application_definition %>
require 'rubygems'
gemfile = File.expand_path('../../../../Gemfile', __FILE__)

if File.exist?(gemfile)
  ENV['BUNDLE_GEMFILE'] = gemfile
  require 'bundler'
  Bundler.setup
end

$:.unshift File.expand_path('../../../../lib', __FILE__)Rails.application.routes.draw do

  mount <%= camelized %>::Engine => "/<%= name %>"
end
require 'test_helper'

class <%= camelized %>Test < ActiveSupport::TestCase
  test "truth" do
    assert_kind_of Module, <%= camelized %>
  end
end
require 'test_helper'

class NavigationTest < ActionDispatch::IntegrationTest
<% unless options[:skip_active_record] -%>
  fixtures :all
<% end -%>

  # test "the truth" do
  #   assert true
  # end
end

# Configure Rails Environment
ENV["RAILS_ENV"] = "test"

require File.expand_path("../dummy/config/environment.rb",  __FILE__)
require "rails/test_help"

Rails.backtrace_cleaner.remove_silencers!

# Load support files
Dir["#{File.dirname(__FILE__)}/support/**/*.rb"].each { |f| require f }

# Load fixtures from the engine
if ActiveSupport::TestCase.method_defined?(:fixture_path=)
  ActiveSupport::TestCase.fixture_path = File.expand_path("../fixtures", __FILE__)
end
require 'rails/generators/resource_helpers'
require 'rails/generators/rails/model/model_generator'
require 'active_support/core_ext/object/blank'

module Rails
  module Generators
    class ResourceGenerator < ModelGenerator #metagenerator
      include ResourceHelpers

      hook_for :resource_controller, :required => true do |controller|
        invoke controller, [ controller_name, options[:actions] ]
      end

      class_option :actions, :type => :array, :banner => "ACTION ACTION", :default => [],
                             :desc => "Actions for the resource controller"

      hook_for :resource_route, :required => true
    end
  end
end
module Rails
  module Generators
    class ResourceRouteGenerator < NamedBase

      # Properly nests namespaces passed into a generator
      #
      #   $ rails generate resource admin/users/products
      #
      # should give you
      #
      #   namespace :admin do
      #     namespace :users
      #       resources :products
      #     end
      #   end
      def add_resource_route
        return if options[:actions].present?

        # iterates over all namespaces and opens up blocks
        regular_class_path.each_with_index do |namespace, index|
          write("namespace :#{namespace} do", index + 1)
        end

        # inserts the primary resource
        write("resources :#{file_name.pluralize}", route_length + 1)

        # ends blocks
        regular_class_path.each_index do |index|
          write("end", route_length - index)
        end

        # route prepends two spaces onto the front of the string that is passed, this corrects that
        route route_string[2..-1]
      end
      
      private
        def route_string
          @route_string ||= ""
        end

        def write(str, indent)
          route_string << "#{"  " * indent}#{str}\n"
        end

        def route_length
          regular_class_path.length
        end
    end
  end
end
require 'rails/generators/rails/resource/resource_generator'

module Rails
  module Generators
    class ScaffoldGenerator < ResourceGenerator #metagenerator
      remove_hook_for :resource_controller
      remove_class_option :actions

      class_option :stylesheets, :type => :boolean, :desc => "Generate Stylesheets"
      class_option :stylesheet_engine, :desc => "Engine for Stylesheets"

      hook_for :scaffold_controller, :required => true

      hook_for :assets do |assets|
        invoke assets, [controller_name]
      end

      hook_for :stylesheet_engine do |stylesheet_engine|
        invoke stylesheet_engine, [controller_name] if options[:stylesheets] && behavior == :invoke
      end
    end
  end
end
require 'rails/generators/resource_helpers'

module Rails
  module Generators
    class ScaffoldControllerGenerator < NamedBase
      include ResourceHelpers

      check_class_collision :suffix => "Controller"

      class_option :orm, :banner => "NAME", :type => :string, :required => true,
                         :desc => "ORM to generate the controller for"

      def create_controller_files
        template 'controller.rb', File.join('app/controllers', class_path, "#{controller_file_name}_controller.rb")
      end

      hook_for :template_engine, :test_framework, :as => :scaffold

      # Invoke the helper using the controller name (pluralized)
      hook_for :helper, :as => :scaffold do |invoked|
        invoke invoked, [ controller_name ]
      end
    end
  end
end
<% if namespaced? -%>
require_dependency "<%= namespaced_file_path %>/application_controller"

<% end -%>
<% module_namespacing do -%>
class <%= controller_class_name %>Controller < ApplicationController
  # GET <%= route_url %>
  # GET <%= route_url %>.json
  def index
    @<%= plural_table_name %> = <%= orm_class.all(class_name) %>

    respond_to do |format|
      format.html # index.html.erb
      format.json { render <%= key_value :json, "@#{plural_table_name}" %> }
    end
  end

  # GET <%= route_url %>/1
  # GET <%= route_url %>/1.json
  def show
    @<%= singular_table_name %> = <%= orm_class.find(class_name, "params[:id]") %>

    respond_to do |format|
      format.html # show.html.erb
      format.json { render <%= key_value :json, "@#{singular_table_name}" %> }
    end
  end

  # GET <%= route_url %>/new
  # GET <%= route_url %>/new.json
  def new
    @<%= singular_table_name %> = <%= orm_class.build(class_name) %>

    respond_to do |format|
      format.html # new.html.erb
      format.json { render <%= key_value :json, "@#{singular_table_name}" %> }
    end
  end

  # GET <%= route_url %>/1/edit
  def edit
    @<%= singular_table_name %> = <%= orm_class.find(class_name, "params[:id]") %>
  end

  # POST <%= route_url %>
  # POST <%= route_url %>.json
  def create
    @<%= singular_table_name %> = <%= orm_class.build(class_name, "params[:#{singular_table_name}]") %>

    respond_to do |format|
      if @<%= orm_instance.save %>
        format.html { redirect_to @<%= singular_table_name %>, <%= key_value :notice, "'#{human_name} was successfully created.'" %> }
        format.json { render <%= key_value :json, "@#{singular_table_name}" %>, <%= key_value :status, ':created' %>, <%= key_value :location, "@#{singular_table_name}" %> }
      else
        format.html { render <%= key_value :action, '"new"' %> }
        format.json { render <%= key_value :json, "@#{orm_instance.errors}" %>, <%= key_value :status, ':unprocessable_entity' %> }
      end
    end
  end

  # PUT <%= route_url %>/1
  # PUT <%= route_url %>/1.json
  def update
    @<%= singular_table_name %> = <%= orm_class.find(class_name, "params[:id]") %>

    respond_to do |format|
      if @<%= orm_instance.update_attributes("params[:#{singular_table_name}]") %>
        format.html { redirect_to @<%= singular_table_name %>, <%= key_value :notice, "'#{human_name} was successfully updated.'" %> }
        format.json { head :no_content }
      else
        format.html { render <%= key_value :action, '"edit"' %> }
        format.json { render <%= key_value :json, "@#{orm_instance.errors}" %>, <%= key_value :status, ':unprocessable_entity' %> }
      end
    end
  end

  # DELETE <%= route_url %>/1
  # DELETE <%= route_url %>/1.json
  def destroy
    @<%= singular_table_name %> = <%= orm_class.find(class_name, "params[:id]") %>
    @<%= orm_instance.destroy %>

    respond_to do |format|
      format.html { redirect_to <%= index_helper %>_url }
      format.json { head :no_content }
    end
  end
end
<% end -%>
module Rails
  module Generators
    class SessionMigrationGenerator < NamedBase #metagenerator
      argument :name, :type => :string, :default => "add_sessions_table"
      hook_for :orm, :required => true
    end
  end
end
module Rails
  module Generators
    class TaskGenerator < NamedBase
      argument :actions, :type => :array, :default => [], :banner => "action action"

      def create_task_files
        template 'task.rb', File.join('lib/tasks', "#{file_name}.rake")
      end

    end
  end
end
namespace :<%= file_name %> do
<% actions.each do |action| -%>
  desc "TODO"
  task :<%= action %> => :environment do
  end

<% end -%>
end
require 'rails/generators/active_model'

module Rails
  module Generators
    # Deal with controller names on scaffold and add some helpers to deal with
    # ActiveModel.
    #
    module ResourceHelpers
      mattr_accessor :skip_warn

      def self.included(base) #:nodoc:
        base.class_option :force_plural, :type => :boolean, :desc => "Forces the use of a plural ModelName"
      end

      # Set controller variables on initialization.
      #
      def initialize(*args) #:nodoc:
        super

        if name == name.pluralize && name.singularize != name.pluralize && !options[:force_plural]
          unless ResourceHelpers.skip_warn
            say "Plural version of the model detected, using singularized version. Override with --force-plural."
            ResourceHelpers.skip_warn = true
          end
          name.replace name.singularize
          assign_names!(name)
        end

        @controller_name = name.pluralize
      end

      protected

        attr_reader :controller_name

        def controller_class_path
          class_path
        end

        def controller_file_name
          @controller_file_name ||= file_name.pluralize
        end

        def controller_file_path
          @controller_file_path ||= (controller_class_path + [controller_file_name]).join('/')
        end

        def controller_class_name
          (controller_class_path + [controller_file_name]).map!{ |m| m.camelize }.join('::')
        end

        def controller_i18n_scope
          @controller_i18n_scope ||= controller_file_path.gsub('/', '.')
        end

        # Loads the ORM::Generators::ActiveModel class. This class is responsible
        # to tell scaffold entities how to generate an specific method for the
        # ORM. Check Rails::Generators::ActiveModel for more information.
        def orm_class
          @orm_class ||= begin
            # Raise an error if the class_option :orm was not defined.
            unless self.class.class_options[:orm]
              raise "You need to have :orm as class option to invoke orm_class and orm_instance"
            end

            begin
              "#{options[:orm].to_s.camelize}::Generators::ActiveModel".constantize
            rescue NameError
              Rails::Generators::ActiveModel
            end
          end
        end

        # Initialize ORM::Generators::ActiveModel to access instance methods.
        def orm_instance(name=singular_table_name)
          @orm_instance ||= orm_class.new(name)
        end
    end
  end
end
require 'active_support/core_ext/class/attribute'
require 'active_support/core_ext/module/delegation'
require 'active_support/core_ext/hash/reverse_merge'
require 'active_support/core_ext/kernel/reporting'
require 'rails/generators'
require 'fileutils'

module Rails
  module Generators
    # Disable color in output. Easier to debug.
    no_color!

    # This class provides a TestCase for testing generators. To setup, you need
    # just to configure the destination and set which generator is being tested:
    #
    #   class AppGeneratorTest < Rails::Generators::TestCase
    #     tests AppGenerator
    #     destination File.expand_path("../tmp", File.dirname(__FILE__))
    #   end
    #
    # If you want to ensure your destination root is clean before running each test,
    # you can set a setup callback:
    #
    #   class AppGeneratorTest < Rails::Generators::TestCase
    #     tests AppGenerator
    #     destination File.expand_path("../tmp", File.dirname(__FILE__))
    #     setup :prepare_destination
    #   end
    #
    class TestCase < ActiveSupport::TestCase
      include FileUtils

      class_attribute :destination_root, :current_path, :generator_class, :default_arguments
      delegate :destination_root, :current_path, :generator_class, :default_arguments, :to => :'self.class'

      # Generators frequently change the current path using +FileUtils.cd+.
      # So we need to store the path at file load and revert back to it after each test.
      self.current_path = File.expand_path(Dir.pwd)
      self.default_arguments = []

      setup :destination_root_is_set?, :ensure_current_path
      teardown :ensure_current_path

      # Sets which generator should be tested:
      #
      #   tests AppGenerator
      #
      def self.tests(klass)
        self.generator_class = klass
      end

      # Sets default arguments on generator invocation. This can be overwritten when
      # invoking it.
      #
      #   arguments %w(app_name --skip-active-record)
      #
      def self.arguments(array)
        self.default_arguments = array
      end

      # Sets the destination of generator files:
      #
      #   destination File.expand_path("../tmp", File.dirname(__FILE__))
      #
      def self.destination(path)
        self.destination_root = path
      end

      # Asserts a given file exists. You need to supply an absolute path or a path relative
      # to the configured destination:
      #
      #   assert_file "config/environment.rb"
      #
      # You can also give extra arguments. If the argument is a regexp, it will check if the
      # regular expression matches the given file content. If it's a string, it compares the
      # file with the given string:
      #
      #   assert_file "config/environment.rb", /initialize/
      #
      # Finally, when a block is given, it yields the file content:
      #
      #   assert_file "app/controller/products_controller.rb" do |controller|
      #     assert_instance_method :index, content do |index|
      #       assert_match(/Product\.all/, index)
      #     end
      #   end
      #
      def assert_file(relative, *contents)
        absolute = File.expand_path(relative, destination_root)
        assert File.exists?(absolute), "Expected file #{relative.inspect} to exist, but does not"

        read = File.read(absolute) if block_given? || !contents.empty?
        yield read if block_given?

        contents.each do |content|
          case content
            when String
              assert_equal content, read
            when Regexp
              assert_match content, read
          end
        end
      end
      alias :assert_directory :assert_file

      # Asserts a given file does not exist. You need to supply an absolute path or a
      # path relative to the configured destination:
      #
      #   assert_no_file "config/random.rb"
      #
      def assert_no_file(relative)
        absolute = File.expand_path(relative, destination_root)
        assert !File.exists?(absolute), "Expected file #{relative.inspect} to not exist, but does"
      end
      alias :assert_no_directory :assert_no_file

      # Asserts a given migration exists. You need to supply an absolute path or a
      # path relative to the configured destination:
      #
      #   assert_migration "db/migrate/create_products.rb"
      #
      # This method manipulates the given path and tries to find any migration which
      # matches the migration name. For example, the call above is converted to:
      #
      #   assert_file "db/migrate/003_create_products.rb"
      #
      # Consequently, assert_migration accepts the same arguments has assert_file.
      #
      def assert_migration(relative, *contents, &block)
        file_name = migration_file_name(relative)
        assert file_name, "Expected migration #{relative} to exist, but was not found"
        assert_file file_name, *contents, &block
      end

      # Asserts a given migration does not exist. You need to supply an absolute path or a
      # path relative to the configured destination:
      #
      #   assert_no_migration "db/migrate/create_products.rb"
      #
      def assert_no_migration(relative)
        file_name = migration_file_name(relative)
        assert_nil file_name, "Expected migration #{relative} to not exist, but found #{file_name}"
      end

      # Asserts the given class method exists in the given content. This method does not detect
      # class methods inside (class << self), only class methods which starts with "self.".
      # When a block is given, it yields the content of the method.
      #
      #   assert_migration "db/migrate/create_products.rb" do |migration|
      #     assert_class_method :up, migration do |up|
      #       assert_match(/create_table/, up)
      #     end
      #   end
      #
      def assert_class_method(method, content, &block)
        assert_instance_method "self.#{method}", content, &block
      end

      # Asserts the given method exists in the given content. When a block is given,
      # it yields the content of the method.
      #
      #   assert_file "app/controller/products_controller.rb" do |controller|
      #     assert_instance_method :index, content do |index|
      #       assert_match(/Product\.all/, index)
      #     end
      #   end
      #
      def assert_instance_method(method, content)
        assert content =~ /def #{method}(\(.+\))?(.*?)\n  end/m, "Expected to have method #{method}"
        yield $2.strip if block_given?
      end
      alias :assert_method :assert_instance_method

      # Asserts the given attribute type gets translated to a field type
      # properly:
      #
      #   assert_field_type :date, :date_select
      #
      def assert_field_type(attribute_type, field_type)
        assert_equal(field_type, create_generated_attribute(attribute_type).field_type)
      end

      # Asserts the given attribute type gets a proper default value:
      #
      #   assert_field_default_value :string, "MyString"
      #
      def assert_field_default_value(attribute_type, value)
        assert_equal(value, create_generated_attribute(attribute_type).default)
      end

      # Runs the generator configured for this class. The first argument is an array like
      # command line arguments:
      #
      #   class AppGeneratorTest < Rails::Generators::TestCase
      #     tests AppGenerator
      #     destination File.expand_path("../tmp", File.dirname(__FILE__))
      #     teardown :cleanup_destination_root
      #
      #     test "database.yml is not created when skipping Active Record" do
      #       run_generator %w(myapp --skip-active-record)
      #       assert_no_file "config/database.yml"
      #     end
      #   end
      #
      # You can provide a configuration hash as second argument. This method returns the output
      # printed by the generator.
      def run_generator(args=self.default_arguments, config={})
        capture(:stdout) { self.generator_class.start(args, config.reverse_merge(:destination_root => destination_root)) }
      end

      # Instantiate the generator.
      def generator(args=self.default_arguments, options={}, config={})
        @generator ||= self.generator_class.new(args, options, config.reverse_merge(:destination_root => destination_root))
      end

      # Create a Rails::Generators::GeneratedAttribute by supplying the
      # attribute type and, optionally, the attribute name:
      #
      #   create_generated_attribute(:string, 'name')
      #
      def create_generated_attribute(attribute_type, name = 'test', index = nil)
        Rails::Generators::GeneratedAttribute.parse([name, attribute_type, index].compact.join(':'))
      end

      protected

        def destination_root_is_set? #:nodoc:
          raise "You need to configure your Rails::Generators::TestCase destination root." unless destination_root
        end

        def ensure_current_path #:nodoc:
          cd current_path
        end

        def prepare_destination
          rm_rf(destination_root)
          mkdir_p(destination_root)
        end

        def migration_file_name(relative) #:nodoc:
          absolute = File.expand_path(relative, destination_root)
          dirname, file_name = File.dirname(absolute), File.basename(absolute).sub(/\.rb$/, '')
          Dir.glob("#{dirname}/[0-9]*_*.rb").grep(/\d+_#{file_name}.rb$/).first
        end
    end
  end
end
require 'rails/generators/test_unit'

module TestUnit
  module Generators
    class ControllerGenerator < Base
      argument :actions, :type => :array, :default => [], :banner => "action action"
      check_class_collision :suffix => "ControllerTest"

      def create_test_files
        template 'functional_test.rb',
                 File.join('test/functional', class_path, "#{file_name}_controller_test.rb")
      end
    end
  end
end
require 'test_helper'

<% module_namespacing do -%>
class <%= class_name %>ControllerTest < ActionController::TestCase
<% if actions.empty? -%>
  # test "the truth" do
  #   assert true
  # end
<% else -%>
<% actions.each do |action| -%>
  test "should get <%= action %>" do
    get :<%= action %>
    assert_response :success
  end

<% end -%>
<% end -%>
end
<% end -%>
require 'rails/generators/test_unit'

module TestUnit
  module Generators
    class HelperGenerator < Base
      check_class_collision :suffix => "HelperTest"

      def create_helper_files
        template 'helper_test.rb', File.join('test/unit/helpers', class_path, "#{file_name}_helper_test.rb")
      end
    end
  end
end
require 'test_helper'

<% module_namespacing do -%>
class <%= class_name %>HelperTest < ActionView::TestCase
end
<% end -%>
require 'rails/generators/test_unit'

module TestUnit
  module Generators
    class IntegrationGenerator < Base
      check_class_collision :suffix => "Test"

      def create_test_files
        template 'integration_test.rb', File.join('test/integration', class_path, "#{file_name}_test.rb")
      end
    end
  end
end
require 'test_helper'

class <%= class_name %>Test < ActionDispatch::IntegrationTest
  # test "the truth" do
  #   assert true
  # end
end
require 'rails/generators/test_unit'

module TestUnit
  module Generators
    class MailerGenerator < Base
      argument :actions, :type => :array, :default => [], :banner => "method method"
      check_class_collision :suffix => "Test"

      def create_test_files
        template "functional_test.rb", File.join('test/functional', class_path, "#{file_name}_test.rb")
      end
    end
  end
end
require 'test_helper'

<% module_namespacing do -%>
class <%= class_name %>Test < ActionMailer::TestCase
<% actions.each do |action| -%>
  test "<%= action %>" do
    mail = <%= class_name %>.<%= action %>
    assert_equal <%= action.to_s.humanize.inspect %>, mail.subject
    assert_equal ["to@example.org"], mail.to
    assert_equal ["from@example.com"], mail.from
    assert_match "Hi", mail.body.encoded
  end

<% end -%>
<% if actions.blank? -%>
  # test "the truth" do
  #   assert true
  # end
<% end -%>
end
<% end -%>
require 'rails/generators/test_unit'

module TestUnit
  module Generators
    class ModelGenerator < Base
      argument :attributes, :type => :array, :default => [], :banner => "field:type field:type"
      class_option :fixture, :type => :boolean

      check_class_collision :suffix => "Test"

      def create_test_file
        template 'unit_test.rb', File.join('test/unit', class_path, "#{file_name}_test.rb")
      end

      hook_for :fixture_replacement

      def create_fixture_file
        if options[:fixture] && options[:fixture_replacement].nil?
          template 'fixtures.yml', File.join('test/fixtures', class_path, "#{plural_file_name}.yml")
        end
      end
    end
  end
end
require 'test_helper'

<% module_namespacing do -%>
class <%= class_name %>Test < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
<% end -%>
require 'rails/generators/test_unit'

module TestUnit
  module Generators
    class ObserverGenerator < Base
      check_class_collision :suffix => "ObserverTest"

      def create_test_files
        template 'unit_test.rb',  File.join('test/unit', class_path, "#{file_name}_observer_test.rb")
      end
    end
  end
end
require 'test_helper'

<% module_namespacing do -%>
class <%= class_name %>ObserverTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
<% end -%>
require 'rails/generators/test_unit'

module TestUnit
  module Generators
    class PerformanceGenerator < Base
      check_class_collision :suffix => "Test"

      def create_test_files
        template 'performance_test.rb', File.join('test/performance', class_path, "#{file_name}_test.rb")
      end
    end
  end
end
require 'test_helper'
require 'rails/performance_test_help'

class <%= class_name %>Test < ActionDispatch::PerformanceTest
  # Refer to the documentation for all available options
  # self.profile_options = { :runs => 5, :metrics => [:wall_time, :memory]
  #                          :output => 'tmp/performance', :formats => [:flat] }

  def test_homepage
    get '/'
  end
end
require 'rails/generators/test_unit'

module TestUnit
  module Generators
    class PluginGenerator < Base
      check_class_collision :suffix => "Test"

      def create_test_files
        directory '.', 'test'
      end
    end
  end
end
require 'rubygems'
require 'test/unit'
require 'active_support'
require 'rails/generators/test_unit'
require 'rails/generators/resource_helpers'

module TestUnit
  module Generators
    class ScaffoldGenerator < Base
      include Rails::Generators::ResourceHelpers

      check_class_collision :suffix => "ControllerTest"

      argument :attributes, :type => :array, :default => [], :banner => "field:type field:type"

      def create_test_files
        template 'functional_test.rb',
                 File.join('test/functional', controller_class_path, "#{controller_file_name}_controller_test.rb")
      end

      private

        def resource_attributes
          key_value singular_table_name, "{ #{attributes_hash} }"
        end

        def attributes_hash
          return if accessible_attributes.empty?

          accessible_attributes.map do |a|
            name = a.name
            key_value name, "@#{singular_table_name}.#{name}"
          end.sort.join(', ')
        end

        def accessible_attributes
          attributes.reject(&:reference?)
        end
    end
  end
end
require 'test_helper'

<% module_namespacing do -%>
class <%= controller_class_name %>ControllerTest < ActionController::TestCase
  setup do
    @<%= singular_table_name %> = <%= table_name %>(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:<%= table_name %>)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create <%= singular_table_name %>" do
    assert_difference('<%= class_name %>.count') do
      post :create, <%= resource_attributes %>
    end

    assert_redirected_to <%= singular_table_name %>_path(assigns(:<%= singular_table_name %>))
  end

  test "should show <%= singular_table_name %>" do
    get :show, <%= key_value :id, "@#{singular_table_name}" %>
    assert_response :success
  end

  test "should get edit" do
    get :edit, <%= key_value :id, "@#{singular_table_name}" %>
    assert_response :success
  end

  test "should update <%= singular_table_name %>" do
    put :update, <%= key_value :id, "@#{singular_table_name}" %>, <%= resource_attributes %>
    assert_redirected_to <%= singular_table_name %>_path(assigns(:<%= singular_table_name %>))
  end

  test "should destroy <%= singular_table_name %>" do
    assert_difference('<%= class_name %>.count', -1) do
      delete :destroy, <%= key_value :id, "@#{singular_table_name}" %>
    end

    assert_redirected_to <%= index_helper %>_path
  end
end
<% end -%>
require 'rails/generators/named_base'

module TestUnit
  module Generators
    class Base < Rails::Generators::NamedBase #:nodoc:
    end
  end
end
activesupport_path = File.expand_path('../../../../activesupport/lib', __FILE__)
$:.unshift(activesupport_path) if File.directory?(activesupport_path) && !$:.include?(activesupport_path)

require 'active_support'
require 'active_support/core_ext/object/blank'
require 'active_support/core_ext/kernel/singleton_class'
require 'active_support/core_ext/array/extract_options'
require 'active_support/core_ext/hash/deep_merge'
require 'active_support/core_ext/module/attribute_accessors'
require 'active_support/core_ext/string/inflections'

require 'rails/generators/base'

module Rails
  module Generators
    autoload :Actions,         'rails/generators/actions'
    autoload :ActiveModel,     'rails/generators/active_model'
    autoload :Migration,       'rails/generators/migration'
    autoload :NamedBase,       'rails/generators/named_base'
    autoload :ResourceHelpers, 'rails/generators/resource_helpers'
    autoload :TestCase,        'rails/generators/test_case'

    mattr_accessor :namespace

    DEFAULT_ALIASES = {
      :rails => {
        :actions => '-a',
        :orm => '-o',
        :javascripts => '-j',
        :javascript_engine => '-je',
        :resource_controller => '-c',
        :scaffold_controller => '-c',
        :stylesheets => '-y',
        :stylesheet_engine => '-se',
        :template_engine => '-e',
        :test_framework => '-t'
      },

      :test_unit => {
        :fixture_replacement => '-r',
      },

      :plugin => {
        :generator => '-g',
        :tasks => '-r'
      }
    }

    DEFAULT_OPTIONS = {
      :rails => {
        :assets => true,
        :force_plural => false,
        :helper => true,
        :integration_tool => nil,
        :javascripts => true,
        :javascript_engine => :js,
        :orm => false,
        :performance_tool => nil,
        :resource_controller => :controller,
        :resource_route => true,
        :scaffold_controller => :scaffold_controller,
        :stylesheets => true,
        :stylesheet_engine => :css,
        :test_framework => false,
        :template_engine => :erb
      },

      :plugin => {
        :generator => false,
        :tasks => false
      }
    }

    def self.configure!(config) #:nodoc:
      no_color! unless config.colorize_logging
      aliases.deep_merge! config.aliases
      options.deep_merge! config.options
      fallbacks.merge! config.fallbacks
      templates_path.concat config.templates
      templates_path.uniq!
      hide_namespaces(*config.hidden_namespaces)
    end

    def self.templates_path
      @templates_path ||= []
    end

    def self.aliases #:nodoc:
      @aliases ||= DEFAULT_ALIASES.dup
    end

    def self.options #:nodoc:
      @options ||= DEFAULT_OPTIONS.dup
    end

    # Hold configured generators fallbacks. If a plugin developer wants a
    # generator group to fallback to another group in case of missing generators,
    # they can add a fallback.
    #
    # For example, shoulda is considered a test_framework and is an extension
    # of test_unit. However, most part of shoulda generators are similar to
    # test_unit ones.
    #
    # Shoulda then can tell generators to search for test_unit generators when
    # some of them are not available by adding a fallback:
    #
    #   Rails::Generators.fallbacks[:shoulda] = :test_unit
    #
    def self.fallbacks
      @fallbacks ||= {}
    end

    # Remove the color from output.
    def self.no_color!
      Thor::Base.shell = Thor::Shell::Basic
    end

    # Track all generators subclasses.
    def self.subclasses
      @subclasses ||= []
    end

    # Rails finds namespaces similar to thor, it only adds one rule:
    #
    # Generators names must end with "_generator.rb". This is required because Rails
    # looks in load paths and loads the generator just before it's going to be used.
    #
    # ==== Examples
    #
    #   find_by_namespace :webrat, :rails, :integration
    #
    # Will search for the following generators:
    #
    #   "rails:webrat", "webrat:integration", "webrat"
    #
    # Notice that "rails:generators:webrat" could be loaded as well, what
    # Rails looks for is the first and last parts of the namespace.
    #
    def self.find_by_namespace(name, base=nil, context=nil) #:nodoc:
      lookups = []
      lookups << "#{base}:#{name}"    if base
      lookups << "#{name}:#{context}" if context

      unless base || context
        unless name.to_s.include?(?:)
          lookups << "#{name}:#{name}"
          lookups << "rails:#{name}"
        end
        lookups << "#{name}"
      end

      lookup(lookups)

      namespaces = Hash[subclasses.map { |klass| [klass.namespace, klass] }]

      lookups.each do |namespace|
        klass = namespaces[namespace]
        return klass if klass
      end

      invoke_fallbacks_for(name, base) || invoke_fallbacks_for(context, name)
    end

    # Receives a namespace, arguments and the behavior to invoke the generator.
    # It's used as the default entry point for generate, destroy and update
    # commands.
    def self.invoke(namespace, args=ARGV, config={})
      names = namespace.to_s.split(':')
      if klass = find_by_namespace(names.pop, names.any? && names.join(':'))
        args << "--help" if args.empty? && klass.arguments.any? { |a| a.required? }
        klass.start(args, config)
      else
        puts "Could not find generator #{namespace}."
      end
    end

    def self.hidden_namespaces
      @hidden_namespaces ||= begin
        orm      = options[:rails][:orm]
        test     = options[:rails][:test_framework]
        template = options[:rails][:template_engine]
        css      = options[:rails][:stylesheet_engine]

        [
          "rails",
          "resource_route",
          "#{orm}:migration",
          "#{orm}:model",
          "#{orm}:observer",
          "#{orm}:session_migration",
          "#{test}:controller",
          "#{test}:helper",
          "#{test}:integration",
          "#{test}:mailer",
          "#{test}:model",
          "#{test}:observer",
          "#{test}:scaffold",
          "#{test}:view",
          "#{test}:performance",
          "#{test}:plugin",
          "#{template}:controller",
          "#{template}:scaffold",
          "#{template}:mailer",
          "#{css}:scaffold",
          "#{css}:assets",
          "css:assets",
          "css:scaffold"
        ]
      end
    end

    class << self
      def hide_namespaces(*namespaces)
        hidden_namespaces.concat(namespaces)
      end
      alias hide_namespace hide_namespaces
    end

    # Show help message with available generators.
    def self.help(command = 'generate')
      lookup!

      namespaces = subclasses.map{ |k| k.namespace }
      namespaces.sort!

      groups = Hash.new { |h,k| h[k] = [] }
      namespaces.each do |namespace|
        base = namespace.split(':').first
        groups[base] << namespace
      end

      puts "Usage: rails #{command} GENERATOR [args] [options]"
      puts
      puts "General options:"
      puts "  -h, [--help]     # Print generator's options and usage"
      puts "  -p, [--pretend]  # Run but do not make any changes"
      puts "  -f, [--force]    # Overwrite files that already exist"
      puts "  -s, [--skip]     # Skip files that already exist"
      puts "  -q, [--quiet]    # Suppress status output"
      puts
      puts "Please choose a generator below."
      puts

      # Print Rails defaults first.
      rails = groups.delete("rails")
      rails.map! { |n| n.sub(/^rails:/, '') }
      rails.delete("app")
      rails.delete("plugin_new")
      print_list("rails", rails)

      hidden_namespaces.each {|n| groups.delete(n.to_s) }

      groups.sort.each { |b, n| print_list(b, n) }
    end

    protected

      # Prints a list of generators.
      def self.print_list(base, namespaces) #:nodoc:
        namespaces = namespaces.reject do |n|
          hidden_namespaces.include?(n)
        end

        return if namespaces.empty?
        puts "#{base.camelize}:"

        namespaces.each do |namespace|
          puts("  #{namespace}")
        end

        puts
      end

      # Try fallbacks for the given base.
      def self.invoke_fallbacks_for(name, base) #:nodoc:
        return nil unless base && fallbacks[base.to_sym]
        invoked_fallbacks = []

        Array(fallbacks[base.to_sym]).each do |fallback|
          next if invoked_fallbacks.include?(fallback)
          invoked_fallbacks << fallback

          klass = find_by_namespace(name, fallback)
          return klass if klass
        end

        nil
      end

      # Receives namespaces in an array and tries to find matching generators
      # in the load path.
      def self.lookup(namespaces) #:nodoc:
        paths = namespaces_to_paths(namespaces)

        paths.each do |raw_path|
          ["rails/generators", "generators"].each do |base|
            path = "#{base}/#{raw_path}_generator"

            begin
              require path
              return
            rescue LoadError => e
              raise unless e.message =~ /#{Regexp.escape(path)}$/
            rescue Exception => e
              warn "[WARNING] Could not load generator #{path.inspect}. Error: #{e.message}.\n#{e.backtrace.join("\n")}"
            end
          end
        end
      end

      # This will try to load any generator in the load path to show in help.
      def self.lookup! #:nodoc:
        $LOAD_PATH.each do |base|
          Dir[File.join(base, "{rails/generators,generators}", "**", "*_generator.rb")].each do |path|
            begin
              path = path.sub("#{base}/", "")
              require path
            rescue Exception
              # No problem
            end
          end
        end
      end

      # Convert namespaces to paths by replacing ":" for "/" and adding
      # an extra lookup. For example, "rails:model" should be searched
      # in both: "rails/model/model_generator" and "rails/model_generator".
      def self.namespaces_to_paths(namespaces) #:nodoc:
        paths = []
        namespaces.each do |namespace|
          pieces = namespace.split(":")
          paths << pieces.dup.push(pieces.last).join("/")
          paths << pieces.join("/")
        end
        paths.uniq!
        paths
      end
  end
end
require "cgi"

module Rails
  module Info
    mattr_accessor :properties
    class << (@@properties = [])
      def names
        map {|val| val.first }
      end

      def value_for(property_name)
        if property = assoc(property_name)
          property.last
        end
      end
    end

    class << self #:nodoc:
      def property(name, value = nil)
        value ||= yield
        properties << [name, value] if value
      rescue Exception
      end

      def frameworks
        %w( active_record action_pack active_resource action_mailer active_support )
      end

      def framework_version(framework)
        if Object.const_defined?(framework.classify)
          require "#{framework}/version"
          "#{framework.classify}::VERSION::STRING".constantize
        end
      end

      def to_s
        column_width = properties.names.map {|name| name.length}.max
        info = properties.map do |name, value|
          value = value.join(", ") if value.is_a?(Array)
          "%-#{column_width}s   %s" % [name, value]
        end
        info.unshift "About your application's environment"
        info * "\n"
      end

      alias inspect to_s

      def to_html
        (table = '<table>').tap do
          properties.each do |(name, value)|
            table << %(<tr><td class="name">#{CGI.escapeHTML(name.to_s)}</td>)
            formatted_value = if value.kind_of?(Array)
                  "<ul>" + value.map { |v| "<li>#{CGI.escapeHTML(v.to_s)}</li>" }.join + "</ul>"
                else
                  CGI.escapeHTML(value.to_s)
                end
            table << %(<td class="value">#{formatted_value}</td></tr>)
          end
          table << '</table>'
        end
      end
    end

    # The Ruby version and platform, e.g. "1.8.2 (powerpc-darwin8.2.0)".
    property 'Ruby version', "#{RUBY_VERSION} (#{RUBY_PLATFORM})"

    # The RubyGems version, if it's installed.
    property 'RubyGems version' do
      Gem::RubyGemsVersion
    end

    property 'Rack version' do
      ::Rack.release
    end

    # The Rails version.
    property 'Rails version' do
      Rails::VERSION::STRING
    end

    property 'JavaScript Runtime' do
      ExecJS.runtime.name
    end

    # Versions of each Rails framework (Active Record, Action Pack,
    # Active Resource, Action Mailer, and Active Support).
    frameworks.each do |framework|
      property "#{framework.titlecase} version" do
        framework_version(framework)
      end
    end

    property 'Middleware' do
      Rails.configuration.middleware.map(&:inspect)
    end

    # The application's location on the filesystem.
    property 'Application root' do
      File.expand_path(Rails.root)
    end

    # The current Rails environment (development, test, or production).
    property 'Environment' do
      Rails.env
    end

    # The name of the database adapter for the current environment.
    property 'Database adapter' do
      ActiveRecord::Base.configurations[Rails.env]['adapter']
    end

    property 'Database schema version' do
      ActiveRecord::Migrator.current_version rescue nil
    end
  end
end
class Rails::InfoController < ActionController::Base
  def properties
    if consider_all_requests_local? || request.local?
      render :inline => Rails::Info.to_html
    else
      render :text => '<p>For security purposes, this information is only available to local requests.</p>', :status => :forbidden
    end
  end

  protected

  def consider_all_requests_local?
    Rails.application.config.consider_all_requests_local
  end
end
require 'tsort'

module Rails
  module Initializable
    def self.included(base)
      base.extend ClassMethods
    end

    class Initializer
      attr_reader :name, :block

      def initialize(name, context, options, &block)
        options[:group] ||= :default
        @name, @context, @options, @block = name, context, options, block
      end

      def before
        @options[:before]
      end

      def after
        @options[:after]
      end

      def belongs_to?(group)
        @options[:group] == group || @options[:group] == :all
      end

      def run(*args)
        @context.instance_exec(*args, &block)
      end

      def bind(context)
        return self if @context
        Initializer.new(@name, context, @options, &block)
      end
    end

    class Collection < Array
      include TSort

      alias :tsort_each_node :each
      def tsort_each_child(initializer, &block)
        select { |i| i.before == initializer.name || i.name == initializer.after }.each(&block)
      end

      def +(other)
        Collection.new(to_a + other.to_a)
      end
    end

    def run_initializers(group=:default, *args)
      return if instance_variable_defined?(:@ran)
      initializers.tsort.each do |initializer|
        initializer.run(*args) if initializer.belongs_to?(group)
      end
      @ran = true
    end

    def initializers
      @initializers ||= self.class.initializers_for(self)
    end

    module ClassMethods
      def initializers
        @initializers ||= Collection.new
      end

      def initializers_chain
        initializers = Collection.new
        ancestors.reverse_each do |klass|
          next unless klass.respond_to?(:initializers)
          initializers = initializers + klass.initializers
        end
        initializers
      end

      def initializers_for(binding)
        Collection.new(initializers_chain.map { |i| i.bind(binding) })
      end

      def initializer(name, opts = {}, &blk)
        raise ArgumentError, "A block must be passed when defining an initializer" unless blk
        opts[:after] ||= initializers.last.name unless initializers.empty? || initializers.find { |i| i.name == opts[:before] }
        initializers << Initializer.new(name, nil, opts, &blk)
      end
    end
  end
end
require 'set'

module Rails
  module Paths
    # This object is an extended hash that behaves as root of the <tt>Rails::Paths</tt> system.
    # It allows you to collect information about how you want to structure your application
    # paths by a Hash like API. It requires you to give a physical path on initialization.
    #
    #   root = Root.new "/rails"
    #   root.add "app/controllers", :eager_load => true
    #
    # The command above creates a new root object and add "app/controllers" as a path.
    # This means we can get a +Rails::Paths::Path+ object back like below:
    #
    #   path = root["app/controllers"]
    #   path.eager_load?               # => true
    #   path.is_a?(Rails::Paths::Path) # => true
    #
    # The +Path+ object is simply an array and allows you to easily add extra paths:
    #
    #   path.is_a?(Array) # => true
    #   path.inspect      # => ["app/controllers"]
    #
    #   path << "lib/controllers"
    #   path.inspect      # => ["app/controllers", "lib/controllers"]
    #
    # Notice that when you add a path using +add+, the path object created already
    # contains the path with the same path value given to +add+. In some situations,
    # you may not want this behavior, so you can give :with as option.
    #
    #   root.add "config/routes", :with => "config/routes.rb"
    #   root["config/routes"].inspect # => ["config/routes.rb"]
    #
    # The +add+ method accepts the following options as arguments:
    # eager_load, autoload, autoload_once and glob.
    #
    # Finally, the +Path+ object also provides a few helpers:
    #
    #   root = Root.new "/rails"
    #   root.add "app/controllers"
    #
    #   root["app/controllers"].expanded # => ["/rails/app/controllers"]
    #   root["app/controllers"].existent # => ["/rails/app/controllers"]
    #
    # Check the <tt>Rails::Paths::Path</tt> documentation for more information.
    class Root < ::Hash
      attr_accessor :path

      def initialize(path)
        raise "Argument should be a String of the physical root path" if path.is_a?(Array)
        @current = nil
        @path = path
        @root = self
        super()
      end

      def []=(path, value)
        value = Path.new(self, path, value) unless value.is_a?(Path)
        super(path, value)
      end

      def add(path, options={})
        with = options[:with] || path
        self[path] = Path.new(self, path, with, options)
      end

      def all_paths
        values.tap { |v| v.uniq! }
      end

      def autoload_once
        filter_by(:autoload_once?)
      end

      def eager_load
        filter_by(:eager_load?)
      end

      def autoload_paths
        filter_by(:autoload?)
      end

      def load_paths
        filter_by(:load_path?)
      end

    protected

      def filter_by(constraint)
        all = []
        all_paths.each do |path|
          if path.send(constraint)
            paths  = path.existent
            paths -= path.children.map { |p| p.send(constraint) ? [] : p.existent }.flatten
            all.concat(paths)
          end
        end
        all.uniq!
        all
      end
    end

    class Path < Array
      attr_reader :path
      attr_accessor :glob

      def initialize(root, current, *paths)
        options = paths.last.is_a?(::Hash) ? paths.pop : {}
        super(paths.flatten)

        @current  = current
        @root     = root
        @glob     = options[:glob]

        options[:autoload_once] ? autoload_once! : skip_autoload_once!
        options[:eager_load]    ? eager_load!    : skip_eager_load!
        options[:autoload]      ? autoload!      : skip_autoload!
        options[:load_path]     ? load_path!     : skip_load_path!
      end

      def children
        keys = @root.keys.select { |k| k.include?(@current) }
        keys.delete(@current)
        @root.values_at(*keys.sort)
      end

      def first
        expanded.first
      end

      def last
        expanded.last
      end

      %w(autoload_once eager_load autoload load_path).each do |m|
        class_eval <<-RUBY, __FILE__, __LINE__ + 1
          def #{m}!        # def eager_load!
            @#{m} = true   #   @eager_load = true
          end              # end
                           #
          def skip_#{m}!   # def skip_eager_load!
            @#{m} = false  #   @eager_load = false
          end              # end
                           #
          def #{m}?        # def eager_load?
            @#{m}          #   @eager_load
          end              # end
        RUBY
      end

      # Expands all paths against the root and return all unique values.
      def expanded
        raise "You need to set a path root" unless @root.path
        result = []

        each do |p|
          path = File.expand_path(p, @root.path)

          if @glob
            if File.directory? path
              result.concat expand_dir(path, @glob)
            else
              # FIXME: I think we can remove this branch, but I'm not sure.
              # Say the filesystem has this file:
              #
              #   /tmp/foobar
              #
              # and someone adds this path:
              #
              #   /tmp/foo
              #
              # with a glob of "*", then this function will return
              #
              #   /tmp/foobar
              #
              # We need to figure out if that is desired behavior.
              result.concat expand_file(path, @glob)
            end
          else
            result << path
          end
        end

        result.uniq!
        result
      end

      # Returns all expanded paths but only if they exist in the filesystem.
      def existent
        expanded.select { |f| File.exists?(f) }
      end

      def existent_directories
        expanded.select { |d| File.directory?(d) }
      end

      alias to_a expanded

      private
      def expand_file(path, glob)
        Dir[File.join(path, glob)].sort
      end

      def expand_dir(path, glob)
        Dir.chdir(path) do
          Dir.glob(@glob).map { |file| File.join path, file }.sort
        end
      end
    end
  end
end
ActionController::Base.perform_caching = true
ActiveSupport::Dependencies.mechanism = :require
Rails.logger.level = ActiveSupport::BufferedLogger::INFO
require 'rails/engine'
require 'active_support/core_ext/array/conversions'

module Rails
  # Rails::Plugin is nothing more than a Rails::Engine, but since it's loaded too late
  # in the boot process, it does not have the same configuration powers as a bare
  # Rails::Engine.
  #
  # Opposite to Rails::Railtie and Rails::Engine, you are not supposed to inherit from
  # Rails::Plugin. Rails::Plugin is automatically configured to be an engine by simply
  # placing inside vendor/plugins. Since this is done automatically, you actually cannot
  # declare a Rails::Engine inside your Plugin, otherwise it would cause the same files
  # to be loaded twice. This means that if you want to ship an Engine as gem it cannot
  # be used as plugin and vice-versa.
  #
  # Besides this conceptual difference, the only difference between Rails::Engine and
  # Rails::Plugin is that plugins automatically load the file "init.rb" at the plugin
  # root during the boot process.
  #
  class Plugin < Engine
    def self.global_plugins
      @global_plugins ||= []
    end

    def self.inherited(base)
      raise "You cannot inherit from Rails::Plugin"
    end

    def self.all(list, paths)
      plugins = []
      paths.each do |path|
        Dir["#{path}/*"].each do |plugin_path|
          plugin = new(plugin_path)
          next unless list.include?(plugin.name) || list.include?(:all)
          if global_plugins.include?(plugin.name)
            warn "WARNING: plugin #{plugin.name} from #{path} was not loaded. Plugin with the same name has been already loaded."
            next
          end
          global_plugins << plugin.name
          plugins << plugin
        end
      end

      plugins.sort_by do |p|
        [list.index(p.name) || list.index(:all), p.name.to_s]
      end
    end

    attr_reader :name, :path

    def railtie_name
      name.to_s
    end

    def initialize(root)
      ActiveSupport::Deprecation.warn "You have Rails 2.3-style plugins in vendor/plugins! Support for these plugins will be removed in Rails 4.0. Move them out and bundle them in your Gemfile, or fold them in to your app as lib/myplugin/* and config/initializers/myplugin.rb. See the release notes for more on this: http://weblog.rubyonrails.org/2012/1/4/rails-3-2-0-rc2-has-been-released"
      @name = File.basename(root).to_sym
      config.root = root
    end

    def config
      @config ||= Engine::Configuration.new
    end

    initializer :handle_lib_autoload, :before => :set_load_path do |app|
      autoload = if app.config.reload_plugins
        config.autoload_paths
      else
        config.autoload_once_paths
      end

      autoload.concat paths["lib"].existent
    end

    initializer :load_init_rb, :before => :load_config_initializers do |app|
      init_rb = File.expand_path("init.rb", root)
      if File.file?(init_rb)
        # This double assignment is to prevent an "unused variable" warning on Ruby 1.9.3.
        config = config = app.config
        # TODO: think about evaling initrb in context of Engine (currently it's
        # always evaled in context of Rails::Application)
        eval(File.read(init_rb), binding, init_rb)
      end
    end

    initializer :sanity_check_railties_collision do
      if Engine.subclasses.map { |k| k.root.to_s }.include?(root.to_s)
        raise "\"#{name}\" is a Railtie/Engine and cannot be installed as a plugin"
      end
    end
  end
end
module Rails
  module Rack
    class Debugger
      def initialize(app)
        @app = app

        ARGV.clear # clear ARGV so that rails server options aren't passed to IRB

        require 'ruby-debug'

        ::Debugger.start
        ::Debugger.settings[:autoeval] = true if ::Debugger.respond_to?(:settings)
        puts "=> Debugger enabled"
      rescue LoadError
        puts "You need to install ruby-debug to run the server in debugging mode. With gems, use 'gem install ruby-debug'"
        exit
      end

      def call(env)
        @app.call(env)
      end
    end
  end
end
module Rails
  module Rack
    class LogTailer
      def initialize(app, log = nil)
        @app = app

        path = Pathname.new(log || "#{::File.expand_path(Rails.root)}/log/#{Rails.env}.log").cleanpath

        @cursor = @file = nil
        if ::File.exists?(path)
          @cursor = ::File.size(path)
          @file = ::File.open(path, 'r')
        end
      end

      def call(env)
        response = @app.call(env)
        tail!
        response
      end

      def tail!
        return unless @cursor
        @file.seek @cursor

        unless @file.eof?
          contents = @file.read
          @cursor = @file.tell
          $stdout.print contents
        end
      end
    end
  end
end
require 'active_support/core_ext/time/conversions'
require 'active_support/core_ext/object/blank'

module Rails
  module Rack
    # Sets log tags, logs the request, calls the app, and flushes the logs.
    class Logger < ActiveSupport::LogSubscriber
      def initialize(app, taggers = nil)
        @app, @taggers = app, taggers || []
      end

      def call(env)
        request = ActionDispatch::Request.new(env)

        if Rails.logger.respond_to?(:tagged)
          Rails.logger.tagged(compute_tags(request)) { call_app(request, env) }
        else
          call_app(request, env)
        end
      end

    protected

      def call_app(request, env)
        # Put some space between requests in development logs.
        if Rails.env.development?
          Rails.logger.info ''
          Rails.logger.info ''
        end

        Rails.logger.info started_request_message(request)
        @app.call(env)
      ensure
        ActiveSupport::LogSubscriber.flush_all!
      end

      # Started GET "/session/new" for 127.0.0.1 at 2012-09-26 14:51:42 -0700
      def started_request_message(request)
        'Started %s "%s" for %s at %s' % [
          request.request_method,
          request.filtered_path,
          request.ip,
          Time.now.to_default_s ]
      end

      def compute_tags(request)
        @taggers.collect do |tag|
          case tag
          when Proc
            tag.call(request)
          when Symbol
            request.send(tag)
          else
            tag
          end
        end
      end
    end
  end
end
module Rails
  module Rack
    autoload :Debugger,      "rails/rack/debugger"
    autoload :Logger,        "rails/rack/logger"
    autoload :LogTailer,     "rails/rack/log_tailer"
  end
end
require 'active_support/concern'

module Rails
  class Railtie
    module Configurable
      extend ActiveSupport::Concern

      module ClassMethods
        delegate :config, :to => :instance

        def inherited(base)
          raise "You cannot inherit from a #{self.superclass.name} child"
        end

        def instance
          @instance ||= new
        end

        def respond_to?(*args)
          super || instance.respond_to?(*args)
        end

        def configure(&block)
          class_eval(&block)
        end

        protected

        def method_missing(*args, &block)
          instance.send(*args, &block)
        end
      end
    end
  end
end
require 'rails/configuration'

module Rails
  class Railtie
    class Configuration
      def initialize
        @@options ||= {}
      end

      # Add files that should be watched for change.
      def watchable_files
        @@watchable_files ||= []
      end

      # Add directories that should be watched for change.
      # The key of the hashes should be directories and the values should
      # be an array of extensions to match in each directory.
      def watchable_dirs
        @@watchable_dirs ||= {}
      end

      # This allows you to modify the application's middlewares from Engines.
      #
      # All operations you run on the app_middleware will be replayed on the
      # application once it is defined and the default_middlewares are
      # created
      def app_middleware
        @@app_middleware ||= Rails::Configuration::MiddlewareStackProxy.new
      end

      # This allows you to modify application's generators from Railties.
      #
      # Values set on app_generators will become defaults for application, unless
      # application overwrites them.
      def app_generators
        @@app_generators ||= Rails::Configuration::Generators.new
        yield(@@app_generators) if block_given?
        @@app_generators
      end

      # First configurable block to run. Called before any initializers are run.
      def before_configuration(&block)
        ActiveSupport.on_load(:before_configuration, :yield => true, &block)
      end

      # Third configurable block to run. Does not run if config.cache_classes
      # set to false.
      def before_eager_load(&block)
        ActiveSupport.on_load(:before_eager_load, :yield => true, &block)
      end

      # Second configurable block to run. Called before frameworks initialize.
      def before_initialize(&block)
        ActiveSupport.on_load(:before_initialize, :yield => true, &block)
      end

      # Last configurable block to run. Called after frameworks initialize.
      def after_initialize(&block)
        ActiveSupport.on_load(:after_initialize, :yield => true, &block)
      end

      # Array of callbacks defined by #to_prepare.
      def to_prepare_blocks
        @@to_prepare_blocks ||= []
      end

      # Defines generic callbacks to run before #after_initialize. Useful for
      # Rails::Railtie subclasses.
      def to_prepare(&blk)
        to_prepare_blocks << blk if blk
      end

      def respond_to?(name)
        super || @@options.key?(name.to_sym)
      end

    private

      def method_missing(name, *args, &blk)
        if name.to_s =~ /=$/
          @@options[$`.to_sym] = args.first
        elsif @@options.key?(name)
          @@options[name]
        else
          super
        end
      end
    end
  end
end
require 'rails/initializable'
require 'rails/configuration'
require 'active_support/inflector'
require 'active_support/core_ext/module/introspection'
require 'active_support/core_ext/module/delegation'

module Rails
  # Railtie is the core of the Rails framework and provides several hooks to extend
  # Rails and/or modify the initialization process.
  #
  # Every major component of Rails (Action Mailer, Action Controller,
  # Action View, Active Record and Active Resource) is a Railtie. Each of
  # them is responsible for their own initialization. This makes Rails itself
  # absent of any component hooks, allowing other components to be used in
  # place of any of the Rails defaults.
  #
  # Developing a Rails extension does _not_ require any implementation of
  # Railtie, but if you need to interact with the Rails framework during
  # or after boot, then Railtie is needed.
  #
  # For example, an extension doing any of the following would require Railtie:
  #
  # * creating initializers
  # * configuring a Rails framework for the application, like setting a generator
  # * adding config.* keys to the environment
  # * setting up a subscriber with ActiveSupport::Notifications
  # * adding rake tasks
  #
  # == Creating your Railtie
  #
  # To extend Rails using Railtie, create a Railtie class which inherits
  # from Rails::Railtie within your extension's namespace. This class must be
  # loaded during the Rails boot process.
  #
  # The following example demonstrates an extension which can be used with or without Rails.
  #
  #   # lib/my_gem/railtie.rb
  #   module MyGem
  #     class Railtie < Rails::Railtie
  #     end
  #   end
  #
  #   # lib/my_gem.rb
  #   require 'my_gem/railtie' if defined?(Rails)
  #
  # == Initializers
  #
  # To add an initialization step from your Railtie to Rails boot process, you just need
  # to create an initializer block:
  #
  #   class MyRailtie < Rails::Railtie
  #     initializer "my_railtie.configure_rails_initialization" do
  #       # some initialization behavior
  #     end
  #   end
  #
  # If specified, the block can also receive the application object, in case you
  # need to access some application specific configuration, like middleware:
  #
  #   class MyRailtie < Rails::Railtie
  #     initializer "my_railtie.configure_rails_initialization" do |app|
  #       app.middleware.use MyRailtie::Middleware
  #     end
  #   end
  #
  # Finally, you can also pass :before and :after as option to initializer, in case
  # you want to couple it with a specific step in the initialization process.
  #
  # == Configuration
  #
  # Inside the Railtie class, you can access a config object which contains configuration
  # shared by all railties and the application:
  #
  #   class MyRailtie < Rails::Railtie
  #     # Customize the ORM
  #     config.app_generators.orm :my_railtie_orm
  #
  #     # Add a to_prepare block which is executed once in production
  #     # and before each request in development
  #     config.to_prepare do
  #       MyRailtie.setup!
  #     end
  #   end
  #
  # == Loading rake tasks and generators
  #
  # If your railtie has rake tasks, you can tell Rails to load them through the method
  # rake_tasks:
  #
  #   class MyRailtie < Rails::Railtie
  #     rake_tasks do
  #       load "path/to/my_railtie.tasks"
  #     end
  #   end
  #
  # By default, Rails load generators from your load path. However, if you want to place
  # your generators at a different location, you can specify in your Railtie a block which
  # will load them during normal generators lookup:
  #
  #   class MyRailtie < Rails::Railtie
  #     generators do
  #       require "path/to/my_railtie_generator"
  #     end
  #   end
  #
  # == Application, Plugin and Engine
  #
  # A Rails::Engine is nothing more than a Railtie with some initializers already set.
  # And since Rails::Application and Rails::Plugin are engines, the same configuration
  # described here can be used in all three.
  #
  # Be sure to look at the documentation of those specific classes for more information.
  #
  class Railtie
    autoload :Configurable,  "rails/railtie/configurable"
    autoload :Configuration, "rails/railtie/configuration"

    include Initializable

    ABSTRACT_RAILTIES = %w(Rails::Railtie Rails::Plugin Rails::Engine Rails::Application)

    class << self
      private :new

      def subclasses
        @subclasses ||= []
      end

      def inherited(base)
        unless base.abstract_railtie?
          base.send(:include, Railtie::Configurable)
          subclasses << base
        end
      end

      def rake_tasks(&blk)
        @rake_tasks ||= []
        @rake_tasks << blk if blk
        @rake_tasks
      end

      def console(&blk)
        @load_console ||= []
        @load_console << blk if blk
        @load_console
      end

      def generators(&blk)
        @generators ||= []
        @generators << blk if blk
        @generators
      end

      def abstract_railtie?
        ABSTRACT_RAILTIES.include?(name)
      end

      def railtie_name(name = nil)
        @railtie_name = name.to_s if name
        @railtie_name ||= generate_railtie_name(self.name)
      end

      protected
        def generate_railtie_name(class_or_module)
          ActiveSupport::Inflector.underscore(class_or_module).gsub("/", "_")
        end
    end

    delegate :railtie_name, :to => "self.class"

    def config
      @config ||= Railtie::Configuration.new
    end

    def eager_load!
    end

    def load_console(app=self)
      self.class.console.each { |block| block.call(app) }
    end

    def load_tasks(app=self)
      extend Rake::DSL if defined? Rake::DSL
      self.class.rake_tasks.each { |block| self.instance_exec(app, &block) }

      # load also tasks from all superclasses
      klass = self.class.superclass
      while klass.respond_to?(:rake_tasks)
        klass.rake_tasks.each { |t| self.instance_exec(app, &t) }
        klass = klass.superclass
      end
    end

    def load_generators(app=self)
      self.class.generators.each { |block| block.call(app) }
    end

    def railtie_namespace
      @railtie_namespace ||= self.class.parents.detect { |n| n.respond_to?(:railtie_namespace) }
    end
  end
end
if RUBY_VERSION < '1.8.7'
  desc = defined?(RUBY_DESCRIPTION) ? RUBY_DESCRIPTION : "ruby #{RUBY_VERSION} (#{RUBY_RELEASE_DATE})"
  abort <<-end_message

    Rails 3 requires Ruby 1.8.7 or >= 1.9.2.

    You're running
      #{desc}

    Please upgrade to continue.

  end_message
elsif RUBY_VERSION > '1.9' and RUBY_VERSION < '1.9.2'
  $stderr.puts <<-end_message

    Rails 3 doesn't officially support Ruby 1.9.1 since recent stable
    releases have segfaulted the test suite. Please upgrade to Ruby 1.9.2 or later.

    You're running
      #{RUBY_DESCRIPTION}

  end_message
end
require 'prof'

module Prof #:nodoc:
  # Adapted from Shugo Maeda's unprof.rb
  def self.print_profile(results, io = $stderr)
    total = results.detect { |i|
      i.method_class.nil? && i.method_id == :"#toplevel"
    }.total_time
    total = 0.001 if total < 0.001

    io.puts "  %%   cumulative   self              self     total"
    io.puts " time   seconds   seconds    calls  ms/call  ms/call  name"

    sum = 0.0
    for r in results
      sum += r.self_time

      name =  if r.method_class.nil?
                r.method_id.to_s
              elsif r.method_class.is_a?(Class)
                "#{r.method_class}##{r.method_id}"
              else
                "#{r.method_class}.#{r.method_id}"
              end
      io.printf "%6.2f %8.3f  %8.3f %8d %8.2f %8.2f  %s\n",
        r.self_time / total * 100,
        sum,
        r.self_time,
        r.count,
        r.self_time * 1000 / r.count,
        r.total_time * 1000 / r.count,
        name
    end
  end
end
require 'pathname'

module Rails
  module ScriptRailsLoader
    RUBY = File.join(*RbConfig::CONFIG.values_at("bindir", "ruby_install_name")) + RbConfig::CONFIG["EXEEXT"]
    SCRIPT_RAILS = File.join('script', 'rails')

    def self.exec_script_rails!
      cwd = Dir.pwd
      return unless in_rails_application? || in_rails_application_subdirectory?
      exec RUBY, SCRIPT_RAILS, *ARGV if in_rails_application?
      Dir.chdir("..") do
        # Recurse in a chdir block: if the search fails we want to be sure
        # the application is generated in the original working directory.
        exec_script_rails! unless cwd == Dir.pwd
      end
    rescue SystemCallError
      # could not chdir, no problem just return
    end

    def self.in_rails_application?
      File.exists?(SCRIPT_RAILS)
    end

    def self.in_rails_application_subdirectory?(path = Pathname.new(Dir.pwd))
      File.exists?(File.join(path, SCRIPT_RAILS)) || !path.root? && in_rails_application_subdirectory?(path.parent)
    end
  end
end# Implements the logic behind the rake tasks for annotations like
#
#   rake notes
#   rake notes:optimize
#
# and friends. See <tt>rake -T notes</tt> and <tt>railties/lib/tasks/annotations.rake</tt>.
#
# Annotation objects are triplets <tt>:line</tt>, <tt>:tag</tt>, <tt>:text</tt> that
# represent the line where the annotation lives, its tag, and its text. Note
# the filename is not stored.
#
# Annotations are looked for in comments and modulus whitespace they have to
# start with the tag optionally followed by a colon. Everything up to the end
# of the line (or closing ERB comment tag) is considered to be their text.
class SourceAnnotationExtractor
  class Annotation < Struct.new(:line, :tag, :text)

    # Returns a representation of the annotation that looks like this:
    #
    #   [126] [TODO] This algorithm is simple and clearly correct, make it faster.
    #
    # If +options+ has a flag <tt>:tag</tt> the tag is shown as in the example above.
    # Otherwise the string contains just line and text.
    def to_s(options={})
      s = "[%3d] " % line
      s << "[#{tag}] " if options[:tag]
      s << text
    end
  end

  # Prints all annotations with tag +tag+ under the root directories +app+, +config+, +lib+,
  # +script+, and +test+ (recursively). Only filenames with extension 
  # +.builder+, +.rb+, and +.erb+ are taken into account. The +options+
  # hash is passed to each annotation's +to_s+.
  #
  # This class method is the single entry point for the rake tasks.
  def self.enumerate(tag, options={})
    extractor = new(tag)
    extractor.display(extractor.find, options)
  end

  attr_reader :tag

  def initialize(tag)
    @tag = tag
  end

  # Returns a hash that maps filenames under +dirs+ (recursively) to arrays
  # with their annotations.
  def find(dirs=%w(app config lib script test))
    dirs.inject({}) { |h, dir| h.update(find_in(dir)) }
  end

  # Returns a hash that maps filenames under +dir+ (recursively) to arrays
  # with their annotations. Only files with annotations are included, and only
  # those with extension +.builder+, +.rb+, +.erb+, +.haml+, +.slim+ and +.coffee+
  # are taken into account.
  def find_in(dir)
    results = {}

    Dir.glob("#{dir}/*") do |item|
      next if File.basename(item)[0] == ?.

      if File.directory?(item)
        results.update(find_in(item))
      elsif item =~ /\.(builder|rb|coffee)$/
        results.update(extract_annotations_from(item, /#\s*(#{tag}):?\s*(.*)$/))
      elsif item =~ /\.erb$/
        results.update(extract_annotations_from(item, /<%\s*#\s*(#{tag}):?\s*(.*?)\s*%>/))
      elsif item =~ /\.haml$/
        results.update(extract_annotations_from(item, /-\s*#\s*(#{tag}):?\s*(.*)$/))
      elsif item =~ /\.slim$/
        results.update(extract_annotations_from(item, /\/\s*\s*(#{tag}):?\s*(.*)$/))
      end
    end

    results
  end

  # If +file+ is the filename of a file that contains annotations this method returns
  # a hash with a single entry that maps +file+ to an array of its annotations.
  # Otherwise it returns an empty hash.
  def extract_annotations_from(file, pattern)
    lineno = 0
    result = File.readlines(file).inject([]) do |list, line|
      lineno += 1
      next list unless line =~ pattern
      list << Annotation.new(lineno, $1, $2)
    end
    result.empty? ? {} : { file => result }
  end

  # Prints the mapping from filenames to annotations in +results+ ordered by filename.
  # The +options+ hash is passed to each annotation's +to_s+.
  def display(results, options={})
    results.keys.sort.each do |file|
      puts "#{file}:"
      results[file].each do |note|
        puts "  * #{note.to_s(options)}"
      end
      puts
    end
  end
end
$VERBOSE = nil

# Load Rails rakefile extensions
%w(
  annotations
  documentation
  framework
  log
  middleware
  misc
  routes
  statistics
  tmp
).each do |task|
  load "rails/tasks/#{task}.rake"
end
# Make double-sure the RAILS_ENV is not set to production,
# so fixtures aren't loaded into that environment
abort("Abort testing: Your Rails environment is running in production mode!") if Rails.env.production?

require 'test/unit'
require 'active_support/test_case'
require 'action_controller/test_case'
require 'action_dispatch/testing/integration'

if defined?(Test::Unit::Util::BacktraceFilter) && ENV['BACKTRACE'].nil?
  require 'rails/backtrace_cleaner'
  Test::Unit::Util::BacktraceFilter.module_eval { include Rails::BacktraceFilterForTestUnit }
end

if defined?(MiniTest)
  # Enable turn if it is available
  begin
    require 'turn'

    Turn.config do |c|
      c.natural = true
    end
  rescue LoadError
  end
end

if defined?(ActiveRecord::Base)
  require 'active_record/test_case'

  class ActiveSupport::TestCase
    include ActiveRecord::TestFixtures
    self.fixture_path = "#{Rails.root}/test/fixtures/"

    setup do
      ActiveRecord::IdentityMap.clear
    end
  end

  ActionDispatch::IntegrationTest.fixture_path = ActiveSupport::TestCase.fixture_path

  def create_fixtures(*table_names, &block)
    Fixtures.create_fixtures(ActiveSupport::TestCase.fixture_path, table_names, {}, &block)
  end
end

class ActionController::TestCase
  setup do
    @routes = Rails.application.routes
  end
end

class ActionDispatch::IntegrationTest
  setup do
    @routes = Rails.application.routes
  end
end
module Rails
  class TestUnitRailtie < Rails::Railtie
    config.app_generators do |c|
      c.test_framework :test_unit, :fixture => true,
                                   :fixture_replacement => nil

      c.integration_tool :test_unit
      c.performance_tool :test_unit
    end

    rake_tasks do
      load "rails/test_unit/testing.rake"
    end
  end
end
module Rails
  # Silence the default description to cut down on `rake -T` noise.
  class SubTestTask < Rake::TestTask
    def desc(string)
      # Ignore the description.
    end
  end
end
module Rails
  module VERSION #:nodoc:
    MAJOR = 3
    MINOR = 2
    TINY  = 12
    PRE   = nil

    STRING = [MAJOR, MINOR, TINY, PRE].compact.join('.')
  end
end
require 'rails/ruby_version_check'

require 'pathname'

require 'active_support'
require 'active_support/core_ext/kernel/reporting'
require 'active_support/core_ext/array/extract_options'
require 'active_support/core_ext/logger'

require 'rails/application'
require 'rails/version'

require 'active_support/railtie'
require 'action_dispatch/railtie'

# For Ruby 1.8, this initialization sets $KCODE to 'u' to enable the
# multibyte safe operations. Plugin authors supporting other encodings
# should override this behavior and set the relevant +default_charset+
# on ActionController::Base.
#
# For Ruby 1.9, UTF-8 is the default internal and external encoding.
if RUBY_VERSION < '1.9'
  $KCODE='u'
else
  silence_warnings do
    Encoding.default_external = Encoding::UTF_8
    Encoding.default_internal = Encoding::UTF_8
  end
end

module Rails
  autoload :Info, 'rails/info'
  autoload :InfoController, 'rails/info_controller'

  class << self
    def application
      @@application ||= nil
    end

    def application=(application)
      @@application = application
    end

    # The Configuration instance used to configure the Rails environment
    def configuration
      application.config
    end

    def initialize!
      application.initialize!
    end

    def initialized?
      @@initialized || false
    end

    def initialized=(initialized)
      @@initialized ||= initialized
    end

    def logger
      @@logger ||= nil
    end

    def logger=(logger)
      @@logger = logger
    end

    def backtrace_cleaner
      @@backtrace_cleaner ||= begin
        # Relies on Active Support, so we have to lazy load to postpone definition until AS has been loaded
        require 'rails/backtrace_cleaner'
        Rails::BacktraceCleaner.new
      end
    end

    def root
      application && application.config.root
    end

    def env
      @_env ||= ActiveSupport::StringInquirer.new(ENV["RAILS_ENV"] || ENV["RACK_ENV"] || "development")
    end

    def env=(environment)
      @_env = ActiveSupport::StringInquirer.new(environment)
    end

    def cache
      RAILS_CACHE
    end

    # Returns all rails groups for loading based on:
    #
    # * The Rails environment;
    # * The environment variable RAILS_GROUPS;
    # * The optional envs given as argument and the hash with group dependencies;
    #
    # == Examples
    #
    #   groups :assets => [:development, :test]
    #
    #   # Returns
    #   # => [:default, :development, :assets] for Rails.env == "development"
    #   # => [:default, :production]           for Rails.env == "production"
    #
    def groups(*groups)
      hash = groups.extract_options!
      env = Rails.env
      groups.unshift(:default, env)
      groups.concat ENV["RAILS_GROUPS"].to_s.split(",")
      groups.concat hash.map { |k,v| k if v.map(&:to_s).include?(env) }
      groups.compact!
      groups.uniq!
      groups
    end

    def version
      VERSION::STRING
    end

    def public_path
      application && application.paths["public"].first
    end
  end
end
